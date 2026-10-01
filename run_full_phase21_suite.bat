@echo off
echo =================================================== > verification_output.txt
echo STEP 1: PYTHON TEST SUITE >> verification_output.txt
echo =================================================== >> verification_output.txt
cd floorplan-service
.\.venv\Scripts\python.exe -m pytest -q >> ..\verification_output.txt 2>&1

echo. >> ..\verification_output.txt
echo =================================================== >> ..\verification_output.txt
echo STEP 2: REALISTIC SOLVER MATRIX AND DETERMINISM >> ..\verification_output.txt
echo =================================================== >> ..\verification_output.txt
.\.venv\Scripts\python.exe verify_phase21.py >> ..\verification_output.txt 2>&1

echo. >> ..\verification_output.txt
echo =================================================== >> ..\verification_output.txt
echo STEP 3: NODE BACKEND REGRESSION SUITE >> ..\verification_output.txt
echo =================================================== >> ..\verification_output.txt
cd ..\server
call npm test >> ..\verification_output.txt 2>&1

echo. >> ..\verification_output.txt
echo =================================================== >> ..\verification_output.txt
echo STEP 4: FRONTEND PRODUCTION BUILD >> ..\verification_output.txt
echo =================================================== >> ..\verification_output.txt
cd ..
call npm run build >> verification_output.txt 2>&1

echo. >> verification_output.txt
echo =================================================== >> verification_output.txt
echo ALL STEPS COMPLETE >> verification_output.txt
echo =================================================== >> verification_output.txt
