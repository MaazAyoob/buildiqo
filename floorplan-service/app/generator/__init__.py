"""
Buildiqo.AI - Phase 2.0 AI Floor Plan Generator Package
"""
from .room_registry import (
    ROOM_REGISTRY,
    normalize_room_type,
    get_room_definition,
    RoomDefinition
)
from .schemas import (
    FloorplanGenerationRequest,
    RoomProgramItem,
    GeneratedRoomGeometry,
    FloorLayout,
    GenerationWarning,
    GeneratedFloorplanResponse
)
from .solver import DeterministicFloorplanSolver, SolverException
from .validator import validate_generated_geometry, GeometryValidationResult
from .svg_renderer import render_floorplan_svg
from .dxf_renderer import render_floorplan_dxf

__all__ = [
    "ROOM_REGISTRY",
    "normalize_room_type",
    "get_room_definition",
    "RoomDefinition",
    "FloorplanGenerationRequest",
    "RoomProgramItem",
    "GeneratedRoomGeometry",
    "FloorLayout",
    "GenerationWarning",
    "GeneratedFloorplanResponse",
    "DeterministicFloorplanSolver",
    "SolverException",
    "validate_generated_geometry",
    "GeometryValidationResult",
    "render_floorplan_svg",
    "render_floorplan_dxf"
]
