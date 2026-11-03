@echo off
echo ========================================================
echo   Starting AI Resume Analyzer (Development Mode)
echo ========================================================
echo.

cd /d "%~dp0"

echo Starting FastAPI Backend (Port 8000)...
start "Backend - FastAPI" cmd /k "cd backend && ..\venv\Scripts\python.exe run.py"

echo Starting Vite React Frontend (Port 5173)...
start "Frontend - Vite" cmd /k "cd frontend && npm run dev"

timeout /t 3 >nul
start http://localhost:5173
echo Both servers started!
