import os
import tempfile
import uuid
import logging
from typing import Optional
from fastapi import FastAPI, File, UploadFile, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from .schemas import ExtractionResponse
from .services.extraction_service import extract_dxf_floorplan
from .converters.dwg_converter import (
    convert_dwg_to_dxf,
    is_oda_available,
    ODAUnavailableError,
    InvalidDWGError,
    DWGConversionTimeoutError,
    DWGConversionError
)

logger = logging.getLogger("buildiqo.floorplan.main")

def verify_service_token(x_floorplan_service_token: Optional[str] = Header(None, alias="X-Floorplan-Service-Token")):
    expected_token = os.environ.get("FLOORPLAN_SERVICE_TOKEN")
    if expected_token:
        if not x_floorplan_service_token or x_floorplan_service_token != expected_token:
            raise HTTPException(
                status_code=401,
                detail="Unauthorized: Invalid or missing service token."
            )
    return x_floorplan_service_token

app = FastAPI(
    title="Buildiqo Floor Plan Extraction Service",
    description="Deterministic CAD Floor Plan Geometry Extractor using ezdxf, Shapely, and ODA File Converter",
    version="1.3.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "buildiqo-floorplan-service",
        "engine": "ezdxf + shapely + oda",
        "version": "1.3.0",
        "oda_available": is_oda_available()
    }

async def process_cad_extraction(file: UploadFile) -> ExtractionResponse:
    """
    Unified extraction handler for DXF and DWG CAD floor plans.
    Maintains safe temporary file handling, strict resource limits, and guaranteed cleanup.
    """
    # 1. Validation: file extension
    filename = file.filename or "plan.dxf"
    lower_filename = filename.lower()
    is_dxf = lower_filename.endswith(".dxf")
    is_dwg = lower_filename.endswith(".dwg")

    if not (is_dxf or is_dwg):
        raise HTTPException(
            status_code=400,
            detail="Invalid file format. Only AutoCAD .dxf and .dwg files are supported."
        )

    # 2. Enforce size limits & content presence
    content = await file.read()
    if not content or len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    max_size_bytes = 25 * 1024 * 1024  # 25 MB
    if len(content) > max_size_bytes:
        raise HTTPException(status_code=413, detail="File size exceeds maximum 25 MB limit.")

    temp_dir = tempfile.gettempdir()
    ext = ".dwg" if is_dwg else ".dxf"
    temp_cad_path = os.path.join(temp_dir, f"buildiqo_cad_{uuid.uuid4().hex}{ext}")
    converted_dxf_path = None

    try:
        with open(temp_cad_path, "wb") as f:
            f.write(content)

        # 3. Handle DWG conversion if needed
        if is_dwg:
            logger.info("Converting uploaded DWG file to DXF via ODA adapter.")
            converted_dxf_path = convert_dwg_to_dxf(temp_cad_path)
            target_dxf_path = converted_dxf_path
        else:
            target_dxf_path = temp_cad_path

        # 4. Route through authoritative DXF extraction engine
        result = extract_dxf_floorplan(target_dxf_path, original_filename=filename)
        return result

    except HTTPException:
        raise
    except ODAUnavailableError as e:
        logger.error("DWG conversion unavailable: %s", str(e))
        raise HTTPException(status_code=503, detail=str(e))
    except InvalidDWGError as e:
        logger.warning("Invalid DWG drawing: %s", str(e))
        raise HTTPException(status_code=422, detail=str(e))
    except DWGConversionTimeoutError as e:
        logger.error("DWG conversion timeout: %s", str(e))
        raise HTTPException(status_code=504, detail=str(e))
    except DWGConversionError as e:
        logger.warning("DWG conversion failure: %s", str(e))
        raise HTTPException(status_code=422, detail=str(e))
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        logger.error("Floor plan extraction unexpected error: %s", type(e).__name__)
        raise HTTPException(status_code=500, detail=f"Floor plan extraction failed: {str(e)}")
    finally:
        # 5. Guaranteed cleanup of all temporary CAD files
        if os.path.exists(temp_cad_path):
            try:
                os.remove(temp_cad_path)
            except Exception:
                pass
        if converted_dxf_path and os.path.exists(converted_dxf_path):
            try:
                os.remove(converted_dxf_path)
            except Exception:
                pass

from fastapi.responses import Response
from .generator import (
    FloorplanGenerationRequest,
    GeneratedFloorplanResponse,
    DeterministicFloorplanSolver,
    SolverException,
    validate_generated_geometry,
    render_floorplan_svg,
    render_floorplan_dxf
)

from .extractors.pdf_extractor import extract_pdf_floorplan

@app.post("/extract/dxf", response_model=ExtractionResponse)
async def extract_dxf_endpoint(
    file: UploadFile = File(...),
    _: Optional[str] = Depends(verify_service_token)
):
    """
    Extracts floor plans from DXF (or DWG) files for backward compatibility.
    """
    return await process_cad_extraction(file)

@app.post("/extract/dwg", response_model=ExtractionResponse)
async def extract_dwg_endpoint(
    file: UploadFile = File(...),
    _: Optional[str] = Depends(verify_service_token)
):
    """
    Explicit endpoint for DWG floor plan extraction via ODA -> DXF pipeline.
    """
    return await process_cad_extraction(file)

@app.post("/extract/pdf", response_model=ExtractionResponse)
async def extract_pdf_endpoint(
    file: UploadFile = File(...),
    _: Optional[str] = Depends(verify_service_token)
):
    """
    Extracts floor plans from architectural vector PDF drawings.
    Rejects scanned/raster PDFs gracefully with structured limitation.
    """
    filename = file.filename or "plan.pdf"
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Invalid file format. Only PDF files are supported.")
    
    content = await file.read()
    if not content or len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded PDF file is empty.")
    
    max_size_bytes = 25 * 1024 * 1024  # 25 MB
    if len(content) > max_size_bytes:
        raise HTTPException(status_code=413, detail="File size exceeds maximum 25 MB limit.")
        
    try:
        return extract_pdf_floorplan(content, filename)
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        logger.error("PDF floor plan extraction error: %s", type(e).__name__)
        raise HTTPException(status_code=500, detail=f"PDF extraction failed: {str(e)}")

@app.post("/generate-layout", response_model=GeneratedFloorplanResponse)
async def generate_layout_endpoint(
    request: FloorplanGenerationRequest,
    _: Optional[str] = Depends(verify_service_token)
):
    """
    Generates a deterministic, Vastu-aware, multi-floor architectural layout from requirements.
    Uses recursive space partitioning and Shapely geometry validation.
    """
    try:
        solver = DeterministicFloorplanSolver(request)
        response = solver.solve()

        # Run Shapely invariant validation
        validation = validate_generated_geometry(response)
        if not validation.is_valid:
            error_msg = "; ".join(validation.errors)
            logger.error("Generated geometry failed validation: %s", error_msg)
            raise HTTPException(
                status_code=422,
                detail=f"Generated layout failed geometric constraints: {error_msg}"
            )

        # Attach architectural SVG
        response.svg = render_floorplan_svg(response, active_floor_idx=0)
        return response

    except SolverException as se:
        logger.warning("Solver failed: %s (%s)", se.code, se.message)
        raise HTTPException(
            status_code=422,
            detail={
                "code": se.code,
                "message": se.message,
                "suggestions": se.suggestions
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Unexpected error during layout generation: %s", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate floor plan: {str(e)}"
        )

@app.post("/export/dxf")
async def export_dxf_endpoint(
    response_data: GeneratedFloorplanResponse,
    floor: int = 0,
    _: Optional[str] = Depends(verify_service_token)
):
    """
    Exports generated floor plan layout as an AutoCAD R2018 DXF file.
    """
    try:
        dxf_stream = render_floorplan_dxf(response_data, active_floor_idx=floor)
        return Response(
            content=dxf_stream.getvalue(),
            media_type="application/dxf",
            headers={
                "Content-Disposition": f"attachment; filename=buildiqo_plan_floor_{floor}.dxf"
            }
        )
    except Exception as e:
        logger.exception("DXF export failed: %s", str(e))
        raise HTTPException(status_code=500, detail=f"DXF export failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5001)

