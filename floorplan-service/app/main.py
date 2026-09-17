import os
import tempfile
import uuid
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .schemas import ExtractionResponse
from .services.extraction_service import extract_dxf_floorplan

app = FastAPI(
    title="Buildiqo Floor Plan Extraction Service",
    description="Deterministic CAD Floor Plan Geometry Extractor using ezdxf and Shapely",
    version="1.0.0"
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
        "engine": "ezdxf + shapely",
        "version": "1.0.0"
    }

@app.post("/extract/dxf", response_model=ExtractionResponse)
async def extract_dxf(file: UploadFile = File(...)):
    """
    Extracts rooms, labels, dimensions, and geometry from an uploaded DXF file.
    """
    # 1. Validation: file extension
    filename = file.filename or "plan.dxf"
    if not filename.lower().endswith(".dxf"):
        raise HTTPException(
            status_code=400,
            detail="Invalid file format. Only AutoCAD .dxf files are supported."
        )

    # 2. Safe temporary file handling outside web root
    temp_dir = tempfile.gettempdir()
    safe_filename = f"buildiqo_cad_{uuid.uuid4().hex}.dxf"
    temp_path = os.path.join(temp_dir, safe_filename)

    try:
        content = await file.read()
        if not content or len(content) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        # Enforce size limit (25 MB)
        if len(content) > 25 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File size exceeds maximum 25 MB limit.")

        with open(temp_path, "wb") as f:
            f.write(content)

        # 3. Process extraction
        result = extract_dxf_floorplan(temp_path, original_filename=filename)
        return result

    except HTTPException:
        raise
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Floor plan extraction failed: {str(e)}")
    finally:
        # 4. Guaranteed cleanup
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5001)
