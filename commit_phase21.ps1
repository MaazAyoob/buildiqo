# Phase 2.1 Clean Commit & Push Runner
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "BUILDIQO.AI - COMMITTING & PUSHING PHASE 2.1" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

# 1. Ensure test fixtures are strictly clean from HEAD
Write-Host "`n>>> 1. Ensuring test fixtures match HEAD..." -ForegroundColor Yellow
git checkout HEAD -- floorplan-service/tests/fixtures/sample_floorplan.dxf server/tests/fixtures/TWC_KASTHURI_NAGAR_BOQ_Final_3-2-26.xlsx 2>$null

# 2. Clean up temporary test artifacts
Write-Host ">>> 2. Cleaning temporary artifacts..." -ForegroundColor Yellow
Remove-Item -Path "floorplan-service\scratch_audit.py", "floorplan-service\verify_results.json", "verification_output.txt", "verification_output.log" -Force -ErrorAction SilentlyContinue

# 3. Stage ONLY intended Phase 2.1 files
Write-Host ">>> 3. Staging Phase 2.1 production and test files..." -ForegroundColor Yellow
git add floorplan-service/app/main.py
git add floorplan-service/app/generator/
git add floorplan-service/tests/test_dxf_extractor.py
git add floorplan-service/tests/test_ai_generator.py
git add floorplan-service/verify_phase21.py
git add server/routes/floorplan.js
git add server/services/aiFloorplan/
git add server/tests/commercialBoq.test.js
git add server/tests/aiFloorplan.test.js
git add src/components/planner/StepSpaces.jsx
git add src/components/planner/AiFloorplanModal.jsx
git add src/services/aiFloorplanService.js

# 4. Review staged files
Write-Host "`n>>> 4. Staged files for commit:" -ForegroundColor Green
git diff --cached --stat

# 5. Commit with exact requested message
Write-Host "`n>>> 5. Executing git commit..." -ForegroundColor Yellow
git commit -m "feat(floorplan): upgrade architectural solver quality"

# 6. Status and log check
Write-Host "`n>>> 6. Commit verification:" -ForegroundColor Green
git status
git log -1 --oneline

# 7. Push to origin/main
Write-Host "`n>>> 7. Pushing to origin main..." -ForegroundColor Yellow
git push origin main

# 8. Clean up helper script itself if desired
Remove-Item -Path "$PSScriptRoot\commit_phase21.ps1", "$PSScriptRoot\run_suite.ps1", "$PSScriptRoot\run_full_phase21_suite.bat" -Force -ErrorAction SilentlyContinue

Write-Host "`n===================================================" -ForegroundColor Cyan
Write-Host "PHASE 2.1 COMMIT & PUSH COMPLETED SUCCESSFULLY" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
