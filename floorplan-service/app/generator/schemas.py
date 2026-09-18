"""
Buildiqo.AI - Phase 2.0 AI Floor Plan Generator
Data Models and Request/Response Schemas.
"""
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class RequestedRoom(BaseModel):
    type: str = Field(..., description="Room type identifier (e.g., 'living', 'kitchen', 'bedroom')")
    count: int = Field(default=1, ge=1, le=10, description="Number of instances requested")

class FloorplanGenerationRequest(BaseModel):
    plot_width_ft: float = Field(..., gt=10.0, le=250.0, description="Plot width in feet")
    plot_length_ft: float = Field(..., gt=10.0, le=250.0, description="Plot length in feet")
    plot_facing: str = Field(default="north", description="Plot orientation: 'north', 'south', 'east', or 'west'")
    num_floors: int = Field(default=1, ge=1, le=5, description="Number of building floors (1 to 5)")
    setback_ft: float = Field(default=3.0, ge=0.0, le=20.0, description="Setback distance from plot boundaries in feet")
    rooms_required: List[RequestedRoom] = Field(default_factory=list, description="Requested room types and counts")
    budget_tier: Optional[str] = Field(default="standard", description="standard, premium, or luxury")
    style_preference: Optional[str] = Field(default="modern", description="Architectural style preference")
    vastu_compliant: bool = Field(default=True, description="Enable Vastu Shastra soft spatial preferences")
    seed: Optional[int] = Field(default=None, description="Deterministic seed for reproducible geometry layout")

class RoomProgramItem(BaseModel):
    room_id: str
    type: str
    display_name: str
    count: int = 1
    target_area_sqft: float
    preferred_floor: int = 0
    adjacency: List[str] = Field(default_factory=list)
    compass_zone: str = "NE"
    priority: str = "high"

class GeneratedRoomGeometry(BaseModel):
    room_id: str
    type: str
    name: str
    width: float
    length: float
    area: float
    quantity: int = 1
    floor: int
    x: float
    y: float
    rotation: float = 0.0
    compass_zone: str
    adjacent_to: List[str] = Field(default_factory=list)
    confidence: str = Field(default="generated", description="Strictly 'generated' for AI floor plans")
    polygon: List[List[float]] = Field(default_factory=list)
    doors: List[Dict[str, Any]] = Field(default_factory=list)
    windows: List[Dict[str, Any]] = Field(default_factory=list)

class FloorLayout(BaseModel):
    floor: int
    name: str
    rooms: List[GeneratedRoomGeometry]
    carpet_area_sqft: float
    builtup_area_sqft: float
    circulation_area_sqft: float = Field(default=0.0, description="Dedicated circulation/corridor/hall area in sq.ft")
    unused_area_sqft: float = Field(default=0.0, description="Unassigned usable or open buildable area in sq.ft")
    circulation_corridors: List[Dict[str, Any]] = Field(default_factory=list, description="Explicit circulation polygon corridors")

class GenerationWarning(BaseModel):
    code: str
    room_id: Optional[str] = None
    message: str

class GeneratedFloorplanResponse(BaseModel):
    success: bool = True
    generation_id: str
    seed: int
    plot: Dict[str, float]
    setback_ft: float
    floors: List[FloorLayout]
    warnings: List[GenerationWarning] = Field(default_factory=list)
    constraints: Dict[str, Any] = Field(default_factory=dict)
    svg: str = ""
    dxf_available: bool = True
