@echo off
echo ===================================================
echo Starting Buildiqo.AI Services for Browser Demo...
echo ===================================================

echo Starting Floorplan Service on port 5001...
start "Buildiqo - Python Floorplan Microservice (5001)" cmd /k "cd /d %~dp0floorplan-service && .\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 5001 --reload"

echo Starting Express Backend on port 5000...
start "Buildiqo - Node Backend API (5000)" cmd /k "cd /d %~dp0server && node index.js"

echo Starting Vite Frontend on port 5173...
start "Buildiqo - Vite Frontend (5173)" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo All 3 services have been launched!
echo Frontend will be accessible at: http://localhost:5173
echo.
pause
