import os
import pytest
import ezdxf
from app.extractors.dxf_extractor import parse_dxf_file
from app.services.extraction_service import extract_dxf_floorplan
from app.geometry.room_detection import create_polygon_candidate, analyze_geometry_relationships
from app.classification.room_classifier import classify_room_type

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")
os.makedirs(FIXTURES_DIR, exist_ok=True)
SAMPLE_DXF_PATH = os.path.join(FIXTURES_DIR, "sample_floorplan.dxf")

def create_sample_dxf():
    """Generates the reference sample DXF fixture."""
    doc = ezdxf.new('R2000')
    doc.header['$INSUNITS'] = 2  # Feet
    
    # Layers
    doc.layers.add('ROOM_BOUNDARY', color=3)
    doc.layers.add('ROOM_LABELS', color=7)
    doc.layers.add('PLOT_BOUNDARY', color=1)
    
    msp = doc.modelspace()
    
    # Plot boundary (Container enclosing everything)
    msp.add_lwpolyline([(0, 0), (35, 0), (35, 40), (0, 40)], close=True, dxfattribs={'layer': 'PLOT_BOUNDARY'})
    
    # Room 1: Living Room (16 x 18 ft = 288 sq.ft)
    msp.add_lwpolyline([(2, 2), (18, 2), (18, 20), (2, 20)], close=True, dxfattribs={'layer': 'ROOM_BOUNDARY'})
    msp.add_text("Living Room", dxfattribs={'layer': 'ROOM_LABELS', 'height': 1.0}).set_placement((10, 11))
    
    # Room 2: Kitchen (10 x 12 ft = 120 sq.ft)
    msp.add_lwpolyline([(20, 2), (30, 2), (30, 14), (20, 14)], close=True, dxfattribs={'layer': 'ROOM_BOUNDARY'})
    msp.add_text("Kitchen", dxfattribs={'layer': 'ROOM_LABELS', 'height': 1.0}).set_placement((25, 8))
    
    # Room 3: Master Bedroom (14 x 14 ft = 196 sq.ft)
    msp.add_lwpolyline([(2, 22), (16, 22), (16, 36), (2, 36)], close=True, dxfattribs={'layer': 'ROOM_BOUNDARY'})
    msp.add_text("Master Bedroom", dxfattribs={'layer': 'ROOM_LABELS', 'height': 1.0}).set_placement((9, 29))
    
    doc.saveas(SAMPLE_DXF_PATH)

# Ensure sample exists only if not present on disk
if not os.path.exists(SAMPLE_DXF_PATH):
    create_sample_dxf()

def test_clean_fixture_extraction():
    """Test 1: Clean DXF fixture with 3 rooms and container plot boundary."""
    res = extract_dxf_floorplan(SAMPLE_DXF_PATH, "sample_floorplan.dxf")
    assert res.success is True
    assert res.source.units == "feet"
    assert res.source.unit_confidence == "HIGH"
    
    # 3 rooms + 1 container = 4 polygons extracted
    assert len(res.rooms) == 4
    
    # Find rooms by name
    room_map = {r.name: r for r in res.rooms}
    assert "Living Room" in room_map
    assert "Kitchen" in room_map
    assert "Master Bedroom" in room_map
    
    living = room_map["Living Room"]
    assert living.type == "living"
    assert living.area_sqft == 288.0
    assert living.area_method == "POLYGON_AREA"
    assert living.dimension_method == "MIN_ROTATED_BOUNDING_BOX"
    assert living.confidence == "HIGH"
    assert living.width_ft == 16.0
    assert living.length_ft == 18.0
    
    kitchen = room_map["Kitchen"]
    assert kitchen.type == "kitchen"
    assert kitchen.area_sqft == 120.0
    assert kitchen.confidence == "HIGH"
    assert kitchen.width_ft == 10.0
    assert kitchen.length_ft == 12.0
    
    master = room_map["Master Bedroom"]
    assert master.type == "master_bed"
    assert master.area_sqft == 196.0
    assert master.confidence == "HIGH"
    assert master.width_ft == 14.0
    assert master.length_ft == 14.0
    
    # Total carpet area excludes the container plot boundary (1400 sq.ft)
    # Expected carpet: 288 + 120 + 196 = 604 sq.ft
    assert res.total_usable_carpet_sqft == 604.0

def test_missing_insunits_warning(tmp_path):
    """Test 2: Missing/Unspecified $INSUNITS defaults to feet with LOW confidence and warning."""
    dxf_file = str(tmp_path / "no_units.dxf")
    doc = ezdxf.new('R2000')
    doc.header['$INSUNITS'] = 0  # 0 = Unspecified / Unitless
    msp = doc.modelspace()
    msp.add_lwpolyline([(0, 0), (10, 0), (10, 10), (0, 10)], close=True)
    msp.add_text("Dining", dxfattribs={'height': 1.0}).set_placement((5, 5))
    doc.saveas(dxf_file)
    
    res = extract_dxf_floorplan(dxf_file, "no_units.dxf")
    assert res.success is True
    assert res.source.unit_confidence == "LOW"
    assert any("INSUNITS" in w for w in res.warnings)
    # Confidence of room should be LOW due to missing units
    assert res.rooms[0].confidence == "LOW"

def test_mm_units_conversion(tmp_path):
    """Test 3: Millimeters ($INSUNITS = 4) scaled to feet accurately."""
    dxf_file = str(tmp_path / "mm_units.dxf")
    doc = ezdxf.new('R2000')
    doc.header['$INSUNITS'] = 4  # Millimeters
    msp = doc.modelspace()
    # 3048 mm x 3048 mm = 10 ft x 10 ft
    msp.add_lwpolyline([(0, 0), (3048, 0), (3048, 3048), (0, 3048)], close=True)
    msp.add_text("Puja Mandir", dxfattribs={'height': 200}).set_placement((1500, 1500))
    doc.saveas(dxf_file)
    
    res = extract_dxf_floorplan(dxf_file, "mm_units.dxf")
    assert res.success is True
    assert res.source.units == "millimeters"
    assert res.source.unit_confidence == "HIGH"
    room = res.rooms[0]
    assert room.type == "puja"
    assert round(room.area_sqft) == 100
    assert round(room.width_ft) == 10
    assert round(room.length_ft) == 10

def test_inches_units_conversion(tmp_path):
    """Test 4: Inches ($INSUNITS = 1) scaled to feet accurately."""
    dxf_file = str(tmp_path / "inches_units.dxf")
    doc = ezdxf.new('R2000')
    doc.header['$INSUNITS'] = 1  # Inches
    msp = doc.modelspace()
    # 120 inches x 144 inches = 10 ft x 12 ft = 120 sq.ft
    msp.add_lwpolyline([(0, 0), (120, 0), (120, 144), (0, 144)], close=True)
    msp.add_text("Study", dxfattribs={'height': 10}).set_placement((60, 72))
    doc.saveas(dxf_file)
    
    res = extract_dxf_floorplan(dxf_file, "inches_units.dxf")
    assert res.success is True
    assert res.source.units == "inches"
    assert res.source.unit_confidence == "HIGH"
    room = res.rooms[0]
    assert room.type == "office"
    assert round(room.area_sqft) == 120

def test_small_polygon_thresholds():
    """Test 5: <2 sq.ft rejected; 2-15 sq.ft retained with LOW confidence & warning."""
    # Polygon 1: 1 sq.ft (degenerate/shaft micro-loop)
    micro = create_polygon_candidate([[0, 0], [1, 0], [1, 1], [0, 1]], layer="ROOM")
    assert micro is None
    
    # Polygon 2: 10 sq.ft (small utility / powder toilet)
    small = create_polygon_candidate([[0, 0], [2.5, 0], [2.5, 4], [0, 4]], layer="ROOM")
    assert small is not None
    assert small.area_sqft == 10.0
    assert small.confidence == "LOW"
    assert any("Very small" in w for w in small.warnings)

def test_duplicate_polygon_detection():
    """Test 6: Duplicate polylines detected and excluded from carpet area sum."""
    p1 = create_polygon_candidate([[0, 0], [10, 0], [10, 10], [0, 10]], layer="ROOM", entity_handle="H1")
    p2 = create_polygon_candidate([[0, 0], [10, 0], [10, 10], [0, 10]], layer="ROOM", entity_handle="H2")
    
    candidates = [p1, p2]
    analyze_geometry_relationships(candidates)
    
    assert p1.is_duplicate is False
    assert p2.is_duplicate is True
    assert any("Duplicate" in w for w in p2.warnings)

def test_unmatched_labels(tmp_path):
    """Test 7: Unmatched text labels reported in response."""
    dxf_file = str(tmp_path / "unmatched.dxf")
    doc = ezdxf.new('R2000')
    doc.header['$INSUNITS'] = 2
    msp = doc.modelspace()
    # Polyline at (0,0) to (10,10)
    msp.add_lwpolyline([(0, 0), (10, 0), (10, 10), (0, 10)], close=True)
    msp.add_text("Bedroom 1", dxfattribs={'height': 1.0}).set_placement((5, 5))
    # Text floating outside at (50, 50)
    msp.add_text("NORTH ROAD", dxfattribs={'height': 1.0}).set_placement((50, 50))
    doc.saveas(dxf_file)
    
    res = extract_dxf_floorplan(dxf_file, "unmatched.dxf")
    assert len(res.unmatched_labels) == 1
    assert res.unmatched_labels[0]["text"] == "NORTH ROAD"

def test_unnamed_space_fallback(tmp_path):
    """Test 8: Room polygon with no label gets deterministic Unnamed Space fallback."""
    dxf_file = str(tmp_path / "unnamed.dxf")
    doc = ezdxf.new('R2000')
    doc.header['$INSUNITS'] = 2
    msp = doc.modelspace()
    msp.add_lwpolyline([(0, 0), (10, 0), (10, 10), (0, 10)], close=True)
    doc.saveas(dxf_file)
    
    res = extract_dxf_floorplan(dxf_file, "unnamed.dxf")
    assert len(res.rooms) == 1
    assert "Unnamed Space" in res.rooms[0].name
    assert res.rooms[0].confidence == "MEDIUM"
    assert any("no matching room label" in w for w in res.rooms[0].warnings)

def test_malformed_dxf(tmp_path):
    """Test 9: Malformed DXF raises clear ValueError."""
    bad_file = str(tmp_path / "corrupt.dxf")
    with open(bad_file, "w") as f:
        f.write("NOT A DXF FILE RANDOM BYTES")
    
    with pytest.raises(ValueError) as exc:
        parse_dxf_file(bad_file)
    assert "Malformed" in str(exc.value)

def test_deterministic_room_classifier():
    """Test 10: Room classifier maps labels deterministically without an LLM."""
    assert classify_room_type("Master Bedroom") == "master_bed"
    assert classify_room_type("M. Bed") == "master_bed"
    assert classify_room_type("Guest Room") == "regular_bed"
    assert classify_room_type("Living Hall") == "living"
    assert classify_room_type("Modular Kitchen") == "kitchen"
    assert classify_room_type("Dining Space") == "dining"
    assert classify_room_type("Attached Toilet") == "attached_bath"
    assert classify_room_type("Common Bath") == "common_bath"
    assert classify_room_type("Car Porch") == "parking"
    assert classify_room_type("Internal Staircase") == "staircase"
    assert classify_room_type("Puja Room") == "puja"
    assert classify_room_type("Random Custom Workshop") == "custom"
