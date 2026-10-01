import sys
try:
    from app.generator import (
        solver,
        strategies,
        quality_scorer,
        relationship_graph,
        furniture_solver,
        walls,
        room_registry,
        schemas,
        dxf_renderer,
        svg_renderer,
    )
    print("ALL GENERATOR IMPORTS OK")
except Exception as e:
    print(f"IMPORT ERROR: {e}")
    sys.exit(1)
