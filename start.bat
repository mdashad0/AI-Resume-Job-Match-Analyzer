@echo off
echo ========================================================
echo   AI-Powered Resume & Job Match Analyzer
echo   FastAPI + React + TF-IDF + MongoDB
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Activating Python virtual environment...
if not exist "venv\Scripts\python.exe" (
    echo Error: Virtual environment not found at venv.
    echo Please install dependencies first.
    pause
    exit /b 1
)

echo [2/2] Starting FastAPI Backend on http://localhost:8000 ...
echo (The prebuilt React UI is mounted and will open automatically)
echo.
cd backend
start http://localhost:8000
"..\venv\Scripts\python.exe" run.py
pause
