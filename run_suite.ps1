# Phase 2.1 Full Verification Master Runner
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "PHASE 2.1 VERIFICATION SUITE STARTING" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

# Ensure test fixtures match HEAD before running
git checkout HEAD -- floorplan-service/tests/fixtures/sample_floorplan.dxf server/tests/fixtures/TWC_KASTHURI_NAGAR_BOQ_Final_3-2-26.xlsx 2>$null

$log = "$PSScriptRoot\verification_output.log"
if (Test-Path $log) { Remove-Item $log -Force }

function Log-Step($title) {
    Write-Host "`n>>> $title..." -ForegroundColor Yellow
    "===================================================" | Out-File -FilePath $log -Append -Encoding ascii
    $title | Out-File -FilePath $log -Append -Encoding ascii
    "===================================================" | Out-File -FilePath $log -Append -Encoding ascii
}

# 1. Python Pytest
Log-Step "1. PYTHON TEST SUITE (pytest -q)"
Push-Location "$PSScriptRoot\floorplan-service"
& .\.venv\Scripts\python.exe -m pytest -q *>> $log
Pop-Location
Write-Host "   Python pytest completed." -ForegroundColor Green

# 2. Phase 2.1 Verification Matrix & Solver Cases
Log-Step "2. REALISTIC SOLVER MATRIX (verify_phase21.py)"
Push-Location "$PSScriptRoot\floorplan-service"
& .\.venv\Scripts\python.exe verify_phase21.py *>> $log
Pop-Location
Write-Host "   Realistic solver matrix & determinism completed." -ForegroundColor Green

# 3. Node Regression Suite
Log-Step "3. NODE BACKEND REGRESSION SUITE (npm test)"
Push-Location "$PSScriptRoot\server"
& npm test *>> $log
Pop-Location
Write-Host "   Node backend regression completed." -ForegroundColor Green

# 4. Frontend Production Build
Log-Step "4. FRONTEND PRODUCTION BUILD (npm run build)"
Push-Location "$PSScriptRoot"
& npm run build *>> $log
Pop-Location
Write-Host "   Frontend build completed." -ForegroundColor Green

# Ensure test fixtures match HEAD
git checkout HEAD -- floorplan-service/tests/fixtures/sample_floorplan.dxf server/tests/fixtures/TWC_KASTHURI_NAGAR_BOQ_Final_3-2-26.xlsx 2>$null

Log-Step "ALL VERIFICATION STEPS COMPLETE"
Write-Host "`n===================================================" -ForegroundColor Cyan
Write-Host "ALL VERIFICATION STEPS COMPLETE - RESULTS LOGGED" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
