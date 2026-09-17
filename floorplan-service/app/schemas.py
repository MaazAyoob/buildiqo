from typing import List, Optional, Tuple, Dict, Any
from pydantic import BaseModel, Field

class GeometryData(BaseModel):
    x: float = Field(..., description="Minimum X coordinate in feet")
    y: float = Field(..., description="Minimum Y coordinate in feet")
    width: float = Field(..., description="Bounding box width in feet")
    length: float = Field(..., description="Bounding box length in feet")
    polygon: List[List[float]] = Field(..., description="Closed 2D polygon vertices [[x, y], ...]")
    doors: List[Dict[str, Any]] = Field(default_factory=list)
    windows: List[Dict[str, Any]] = Field(default_factory=list)

class ExtractedRoom(BaseModel):
    id: str = Field(..., description="Deterministic or unique room ID")
    name: str = Field(..., description="Detected room name or label")
    type: str = Field(..., description="Standard Buildiqo room type category")
    width_ft: float = Field(..., description="Estimated room width in feet")
    length_ft: float = Field(..., description="Estimated room length in feet")
    area_sqft: float = Field(..., description="True normalized polygon area in square feet")
    area_method: str = Field(default="POLYGON_AREA", description="Method used for calculating area")
    dimension_method: str = Field(default="MIN_ROTATED_BOUNDING_BOX", description="Method used for calculating dimensions")
    count: int = Field(default=1, description="Quantity multiplier")
    confidence: str = Field(..., description="Confidence score: HIGH, MEDIUM, or LOW")
    source: str = Field(default="DXF_EXTRACTION", description="Extraction source identifier")
    warnings: List[str] = Field(default_factory=list, description="Room-specific extraction warnings")
    geometry: Optional[GeometryData] = Field(None, description="Spatial coordinates and polygon geometry")

class SourceMetadata(BaseModel):
    filename: str
    file_type: str = "DXF"
    units: str
    unit_confidence: str  # HIGH, MEDIUM, LOW

class ExtractionResponse(BaseModel):
    success: bool
    source: SourceMetadata
    rooms: List[ExtractedRoom]
    warnings: List[str] = Field(default_factory=list)
    unmatched_labels: List[Dict[str, Any]] = Field(default_factory=list)
    total_usable_carpet_sqft: float
