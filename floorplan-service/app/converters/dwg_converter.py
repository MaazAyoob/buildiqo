import os
import shutil
import subprocess
import tempfile
import uuid
import logging
from typing import Optional
import ezdxf

logger = logging.getLogger("buildiqo.floorplan.dwg_converter")

# Known AutoCAD DWG file header magic prefixes:
# AC1015 (R2000), AC1018 (R2004), AC1021 (R2007), AC1024 (R2010), AC1027 (R2013), AC1032 (R2018)
VALID_DWG_MAGIC = [
    b"AC1012", b"AC1014", b"AC1015", b"AC1018",
    b"AC1021", b"AC1024", b"AC1027", b"AC1032"
]

class DWGConversionException(Exception):
    """Base exception for DWG conversion errors."""
    pass

class ODAUnavailableError(DWGConversionException):
    """Raised when ODA File Converter executable is not installed or configured."""
    pass

class InvalidDWGError(DWGConversionException):
    """Raised when uploaded file is not a valid AutoCAD DWG drawing."""
    pass

class DWGConversionTimeoutError(DWGConversionException):
    """Raised when conversion process exceeds the execution timeout."""
    pass

class DWGConversionError(DWGConversionException):
    """Raised when conversion fails or output DXF is missing/corrupted."""
    pass


def get_oda_path() -> Optional[str]:
    """
    Returns the resolved path to the ODA File Converter executable,
    or None if not found.
    Checks ODA_FILE_CONVERTER_PATH env var first, then PATH.
    """
    env_path = os.environ.get("ODA_FILE_CONVERTER_PATH")
    if env_path and os.path.isfile(env_path) and os.access(env_path, os.X_OK):
        return env_path
    
    # Common command names across Linux, macOS, and Windows
    candidates = ["ODAFileConverter", "ODAFileConverter.exe"]
    for cmd in candidates:
        resolved = shutil.which(cmd)
        if resolved:
            return resolved
            
    return None


def is_oda_available() -> bool:
    """Returns True if ODA File Converter is installed and executable."""
    return get_oda_path() is not None


def validate_dwg_header(file_path: str) -> bool:
    """
    Verifies that the file begins with a legitimate AutoCAD DWG magic byte header.
    Rejects spoofed, empty, or renamed DXF/text files.
    """
    if not os.path.exists(file_path) or os.path.getsize(file_path) < 6:
        return False
    try:
        with open(file_path, "rb") as f:
            header = f.read(6)
            return any(header.startswith(magic) for magic in VALID_DWG_MAGIC)
    except Exception:
        return False


def convert_dwg_to_dxf(dwg_path: str, output_dxf_path: Optional[str] = None) -> str:
    """
    Converts an input DWG file to DXF format using ODA File Converter.
    
    Architecture:
    - Validates DWG binary magic bytes
    - Creates isolated UUID temporary directory
    - Invokes ODA File Converter with array arguments (shell=False)
    - Enforces timeout (default 30s)
    - Validates resulting DXF via ezdxf.readfile
    - Cleans up temporary artifacts
    
    Returns the path to the validated DXF file.
    """
    oda_bin = get_oda_path()
    if not oda_bin:
        logger.error("ODA File Converter executable not found or not configured.")
        raise ODAUnavailableError(
            "DWG conversion is currently unavailable. Please upload a DXF file or try again later."
        )

    if not validate_dwg_header(dwg_path):
        logger.warning("Uploaded file failed DWG binary header validation.")
        raise InvalidDWGError(
            "The uploaded DWG file could not be converted. Please verify that it is a valid CAD file."
        )

    timeout_sec = int(os.environ.get("ODA_CONVERSION_TIMEOUT_SEC", "30"))
    work_dir = tempfile.mkdtemp(prefix=f"buildiqo_dwg_{uuid.uuid4().hex}_")
    input_dir = os.path.join(work_dir, "input")
    output_dir = os.path.join(work_dir, "output")
    os.makedirs(input_dir, exist_ok=True)
    os.makedirs(output_dir, exist_ok=True)

    input_dwg_filename = "drawing.dwg"
    staged_dwg_path = os.path.join(input_dir, input_dwg_filename)
    expected_dxf_path = os.path.join(output_dir, "drawing.dxf")

    try:
        shutil.copy2(dwg_path, staged_dwg_path)

        # ODA File Converter standard CLI arguments:
        # ODAFileConverter <Input Folder> <Output Folder> <Output Version> <Output Type> <Recurse> <Audit> [<Filter>]
        cmd = [
            oda_bin,
            input_dir,
            output_dir,
            "ACAD2018",  # Standard, highly compatible version for ezdxf
            "DXF",       # Target format
            "0",         # Do not recurse subdirectories
            "1",         # Audit drawing for errors
            "*.dwg"      # Filter pattern
        ]

        logger.info("Executing ODA File Converter in isolated directory.")

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=timeout_sec,
                shell=False
            )
        except subprocess.TimeoutExpired:
            logger.error("ODA File Converter process timed out after %d seconds.", timeout_sec)
            raise DWGConversionTimeoutError(
                "The DWG file took too long to process. Please try a smaller or simpler file."
            )
        except Exception as e:
            logger.error("Subprocess execution error during ODA conversion: %s", type(e).__name__)
            raise DWGConversionError(
                "The uploaded DWG file could not be converted. Please verify that it is a valid CAD file."
            )

        if result.returncode != 0:
            logger.warning("ODA File Converter exited with non-zero code %d.", result.returncode)
            raise DWGConversionError(
                "The uploaded DWG file could not be converted. Please verify that it is a valid CAD file."
            )

        # Verify output DXF exists
        if not os.path.isfile(expected_dxf_path):
            # Check if case sensitivity produced DRAWING.dxf or similar
            candidates = [f for f in os.listdir(output_dir) if f.lower().endswith(".dxf")]
            if candidates:
                expected_dxf_path = os.path.join(output_dir, candidates[0])
            else:
                logger.error("Converted DXF file not found in output directory.")
                raise DWGConversionError(
                    "The uploaded DWG file could not be converted. Please verify that it is a valid CAD file."
                )

        # Validate non-empty file
        dxf_size = os.path.getsize(expected_dxf_path)
        if dxf_size == 0:
            logger.error("Converted DXF file is empty.")
            raise DWGConversionError(
                "The uploaded DWG file could not be converted. Converted CAD file is empty."
            )

        # Validate ezdxf can open it
        try:
            ezdxf.readfile(expected_dxf_path)
        except Exception as e:
            logger.error("ezdxf failed to parse converted DXF: %s", type(e).__name__)
            raise DWGConversionError(
                "The converted CAD data could not be parsed. Please verify the drawing is valid."
            )

        # If destination path requested, copy it over
        final_dxf_path = output_dxf_path or os.path.join(
            tempfile.gettempdir(), f"buildiqo_converted_{uuid.uuid4().hex}.dxf"
        )
        shutil.copy2(expected_dxf_path, final_dxf_path)
        return final_dxf_path

    finally:
        # Guaranteed cleanup of isolated conversion workspace
        if os.path.exists(work_dir):
            try:
                shutil.rmtree(work_dir, ignore_errors=True)
            except Exception:
                pass
