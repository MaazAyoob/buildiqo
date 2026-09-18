import os
import shutil
import tempfile
import subprocess
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.converters.dwg_converter import (
    convert_dwg_to_dxf,
    validate_dwg_header,
    is_oda_available,
    get_oda_path,
    ODAUnavailableError,
    InvalidDWGError,
    DWGConversionTimeoutError,
    DWGConversionError
)
from app.services.extraction_service import extract_dxf_floorplan

client = TestClient(app)

SAMPLE_DXF_PATH = os.path.join(os.path.dirname(__file__), "fixtures", "sample_floorplan.dxf")

# Valid dummy DWG bytes (starts with AutoCAD AC1032 magic bytes followed by minimal binary content)
VALID_DWG_BYTES = b"AC1032" + b"\x00" * 200

@pytest.fixture
def dummy_dwg_file():
    fd, path = tempfile.mkstemp(suffix=".dwg")
    os.write(fd, VALID_DWG_BYTES)
    os.close(fd)
    yield path
    if os.path.exists(path):
        os.remove(path)

@pytest.fixture
def invalid_dwg_file():
    fd, path = tempfile.mkstemp(suffix=".dwg")
    os.write(fd, b"NOT_A_VALID_DWG_HEADER_DATA_12345")
    os.close(fd)
    yield path
    if os.path.exists(path):
        os.remove(path)


def test_validate_dwg_header(dummy_dwg_file, invalid_dwg_file):
    """Verifies that legitimate DWG magic headers pass and non-DWG files fail."""
    assert validate_dwg_header(dummy_dwg_file) is True
    assert validate_dwg_header(invalid_dwg_file) is False
    assert validate_dwg_header(SAMPLE_DXF_PATH) is False  # DXF is ASCII, does not start with AC10


def test_missing_oda_executable(dummy_dwg_file, monkeypatch):
    """When ODA executable is absent, raises controlled ODAUnavailableError."""
    monkeypatch.setenv("ODA_FILE_CONVERTER_PATH", "/non/existent/path/ODAFileConverter")
    monkeypatch.setattr("shutil.which", lambda cmd: None)

    with pytest.raises(ODAUnavailableError) as exc_info:
        convert_dwg_to_dxf(dummy_dwg_file)
    assert "DWG conversion is currently unavailable" in str(exc_info.value)


def test_invalid_dwg_rejection(invalid_dwg_file, monkeypatch):
    """When DWG header is invalid, raises controlled InvalidDWGError."""
    monkeypatch.setattr("app.converters.dwg_converter.get_oda_path", lambda: "/usr/bin/ODAFileConverter")

    with pytest.raises(InvalidDWGError) as exc_info:
        convert_dwg_to_dxf(invalid_dwg_file)
    assert "The uploaded DWG file could not be converted" in str(exc_info.value)


def test_converter_nonzero_exit(dummy_dwg_file, monkeypatch):
    """When ODA converter exits with non-zero status, raises DWGConversionError."""
    monkeypatch.setattr("app.converters.dwg_converter.get_oda_path", lambda: "/usr/bin/ODAFileConverter")

    mock_run = MagicMock(return_value=subprocess.CompletedProcess(
        args=["ODAFileConverter"],
        returncode=1,
        stdout="",
        stderr="Corrupted input DWG"
    ))
    monkeypatch.setattr("subprocess.run", mock_run)

    with pytest.raises(DWGConversionError) as exc_info:
        convert_dwg_to_dxf(dummy_dwg_file)
    assert "The uploaded DWG file could not be converted" in str(exc_info.value)


def test_converter_timeout(dummy_dwg_file, monkeypatch):
    """When ODA converter execution exceeds timeout, raises DWGConversionTimeoutError."""
    monkeypatch.setattr("app.converters.dwg_converter.get_oda_path", lambda: "/usr/bin/ODAFileConverter")

    def mock_timeout(*args, **kwargs):
        raise subprocess.TimeoutExpired(cmd=args[0], timeout=30)

    monkeypatch.setattr("subprocess.run", mock_timeout)

    with pytest.raises(DWGConversionTimeoutError) as exc_info:
        convert_dwg_to_dxf(dummy_dwg_file)
    assert "The DWG file took too long to process" in str(exc_info.value)


def test_missing_output_dxf(dummy_dwg_file, monkeypatch):
    """When ODA finishes with code 0 but creates no output DXF, raises DWGConversionError."""
    monkeypatch.setattr("app.converters.dwg_converter.get_oda_path", lambda: "/usr/bin/ODAFileConverter")

    # subprocess succeeds but output directory remains empty
    mock_run = MagicMock(return_value=subprocess.CompletedProcess(
        args=["ODAFileConverter"],
        returncode=0,
        stdout="Done",
        stderr=""
    ))
    monkeypatch.setattr("subprocess.run", mock_run)

    with pytest.raises(DWGConversionError) as exc_info:
        convert_dwg_to_dxf(dummy_dwg_file)
    assert "The uploaded DWG file could not be converted" in str(exc_info.value)


def test_empty_output_dxf(dummy_dwg_file, monkeypatch):
    """When ODA creates an empty (0 byte) output DXF, raises DWGConversionError."""
    monkeypatch.setattr("app.converters.dwg_converter.get_oda_path", lambda: "/usr/bin/ODAFileConverter")

    def fake_subprocess_run(cmd, **kwargs):
        # Write an empty dxf in the output directory
        output_dir = cmd[2]
        empty_dxf = os.path.join(output_dir, "drawing.dxf")
        with open(empty_dxf, "wb") as f:
            pass
        return subprocess.CompletedProcess(args=cmd, returncode=0, stdout="", stderr="")

    monkeypatch.setattr("subprocess.run", fake_subprocess_run)

    with pytest.raises(DWGConversionError) as exc_info:
        convert_dwg_to_dxf(dummy_dwg_file)
    assert "empty" in str(exc_info.value).lower()


def test_valid_dwg_conversion_mocked(dummy_dwg_file, monkeypatch):
    """
    Valid DWG conversion flow:
    - ODA called with safe args (shell=False)
    - Converted DXF produced and copied from sample fixture
    - Converted DXF validated by ezdxf
    - Cleanup verified
    """
    monkeypatch.setattr("app.converters.dwg_converter.get_oda_path", lambda: "/mock/bin/ODAFileConverter")

    captured_cmds = []

    def fake_subprocess_run(cmd, **kwargs):
        captured_cmds.append((cmd, kwargs))
        # Ensure shell=False was used
        assert kwargs.get("shell") is False
        output_dir = cmd[2]
        out_dxf = os.path.join(output_dir, "drawing.dxf")
        shutil.copy2(SAMPLE_DXF_PATH, out_dxf)
        return subprocess.CompletedProcess(args=cmd, returncode=0, stdout="Success", stderr="")

    monkeypatch.setattr("subprocess.run", fake_subprocess_run)

    out_path = convert_dwg_to_dxf(dummy_dwg_file)
    assert os.path.isfile(out_path)
    assert os.path.getsize(out_path) > 0

    # Verify command structure: ODAFileConverter <in> <out> ACAD2018 DXF 0 1 *.dwg
    cmd, kwargs = captured_cmds[0]
    assert cmd[0] == "/mock/bin/ODAFileConverter"
    assert cmd[3] == "ACAD2018"
    assert cmd[4] == "DXF"
    assert cmd[5] == "0"
    assert cmd[6] == "1"

    # Cleanup returned file
    if os.path.exists(out_path):
        os.remove(out_path)


def test_cleanup_after_failure(dummy_dwg_file, monkeypatch):
    """Ensures temporary conversion directories are wiped clean on failure."""
    monkeypatch.setattr("app.converters.dwg_converter.get_oda_path", lambda: "/mock/bin/ODAFileConverter")

    created_dirs = []
    original_mkdtemp = tempfile.mkdtemp

    def tracking_mkdtemp(*args, **kwargs):
        d = original_mkdtemp(*args, **kwargs)
        created_dirs.append(d)
        return d

    monkeypatch.setattr("tempfile.mkdtemp", tracking_mkdtemp)
    monkeypatch.setattr("subprocess.run", MagicMock(side_effect=RuntimeError("Crash during conversion")))

    with pytest.raises(DWGConversionError):
        convert_dwg_to_dxf(dummy_dwg_file)

    for d in created_dirs:
        assert not os.path.exists(d), f"Temporary directory {d} was not cleaned up!"


def test_command_injection_safety(dummy_dwg_file, monkeypatch):
    """Verifies that arbitrary strings / semicolons cannot cause shell injection."""
    monkeypatch.setattr("app.converters.dwg_converter.get_oda_path", lambda: "/mock/bin/ODAFileConverter; rm -rf /")

    captured_cmds = []

    def fake_subprocess_run(cmd, **kwargs):
        captured_cmds.append((cmd, kwargs))
        assert kwargs.get("shell") is False
        output_dir = cmd[2]
        out_dxf = os.path.join(output_dir, "drawing.dxf")
        shutil.copy2(SAMPLE_DXF_PATH, out_dxf)
        return subprocess.CompletedProcess(args=cmd, returncode=0, stdout="", stderr="")

    monkeypatch.setattr("subprocess.run", fake_subprocess_run)

    out_path = convert_dwg_to_dxf(dummy_dwg_file)
    assert os.path.isfile(out_path)
    # The executable path remains the literal first element in array, never interpreted by shell
    assert captured_cmds[0][0][0] == "/mock/bin/ODAFileConverter; rm -rf /"
    if os.path.exists(out_path):
        os.remove(out_path)


def test_converted_dxf_handed_to_existing_parser(dummy_dwg_file, monkeypatch):
    """
    Simulates DWG extraction endpoint:
    - Valid DWG converted to sample DXF
    - DXF handed to existing deterministic extraction engine
    - Normalized RoomData schema produced: 604 sq.ft carpet, Living Room, Kitchen, Master Bedroom
    """
    monkeypatch.setattr("app.converters.dwg_converter.get_oda_path", lambda: "/mock/bin/ODAFileConverter")

    def fake_subprocess_run(cmd, **kwargs):
        output_dir = cmd[2]
        out_dxf = os.path.join(output_dir, "drawing.dxf")
        shutil.copy2(SAMPLE_DXF_PATH, out_dxf)
        return subprocess.CompletedProcess(args=cmd, returncode=0, stdout="", stderr="")

    monkeypatch.setattr("subprocess.run", fake_subprocess_run)

    with open(dummy_dwg_file, "rb") as f:
        res = client.post(
            "/extract/dwg",
            files={"file": ("residential_floorplan.dwg", f, "application/octet-stream")}
        )

    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["source"]["file_type"] == "DWG"
    assert data["source"]["filename"] == "residential_floorplan.dwg"
    assert data["source"]["units"] == "feet"
    assert data["total_usable_carpet_sqft"] == 604.0
    assert len(data["rooms"]) == 4

    room_names = [r["name"] for r in data["rooms"]]
    assert "Living Room" in room_names
    assert "Kitchen" in room_names
    assert "Master Bedroom" in room_names

    living = next(r for r in data["rooms"] if r["name"] == "Living Room")
    assert living["area_sqft"] == 288.0
    assert living["confidence"] == "HIGH"
    assert living["area_method"] == "POLYGON_AREA"
    assert living["dimension_method"] == "MIN_ROTATED_BOUNDING_BOX"


def test_dwg_endpoint_missing_oda_returns_503(dummy_dwg_file, monkeypatch):
    """When ODA is unavailable in environment, API returns controlled 503 error."""
    monkeypatch.setenv("ODA_FILE_CONVERTER_PATH", "/non/existent/path/ODAFileConverter")
    monkeypatch.setattr("shutil.which", lambda cmd: None)

    with open(dummy_dwg_file, "rb") as f:
        res = client.post(
            "/extract/dwg",
            files={"file": ("plan.dwg", f, "application/octet-stream")}
        )

    assert res.status_code == 503
    assert "DWG conversion is currently unavailable" in res.json()["detail"]


@pytest.mark.skipif(not is_oda_available(), reason="ODA File Converter not installed in local environment")
def test_real_oda_integration(dummy_dwg_file):
    """Real integration test executed only when ODA executable is actually installed."""
    out_dxf = convert_dwg_to_dxf(dummy_dwg_file)
    assert os.path.isfile(out_dxf)
    if os.path.exists(out_dxf):
        os.remove(out_dxf)
