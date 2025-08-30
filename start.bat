@echo off
echo ===============================================
echo    Waste Patrol - Smart Waste Management
echo ===============================================
echo.
echo Starting all services...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python from https://python.org/
    pause
    exit /b 1
)

REM Check if MongoDB is running
echo Checking MongoDB connection...
timeout /t 2 /nobreak >nul

REM Create necessary directories
if not exist "backend\uploads" mkdir "backend\uploads"
if not exist "python_service\uploads" mkdir "python_service\uploads"
if not exist "python_service\processed" mkdir "python_service\processed"

echo.
echo Services will start in separate windows:
echo - Backend API: http://localhost:5000
echo - Python AI Service: http://localhost:8000  
echo - Frontend: http://localhost:3000
echo.

REM Start Backend API
echo Starting Backend API...
start "Waste Patrol - Backend API" cmd /k "cd backend && npm run dev"

REM Wait a moment
timeout /t 3 /nobreak >nul

REM Start Python AI Service
echo Starting Python AI Service...
start "Waste Patrol - Python AI Service" cmd /k "cd python_service && python run.py"

REM Wait a moment
timeout /t 3 /nobreak >nul

REM Start Frontend
echo Starting Frontend...
start "Waste Patrol - Frontend" cmd /k "npm start"

echo.
echo ===============================================
echo All services are starting up!
echo.
echo Frontend will open automatically in your browser
echo at http://localhost:3000
echo.
echo To stop all services, close all the terminal windows
echo ===============================================
echo.
pause
