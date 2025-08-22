@echo off
REM Swachh Netra Web Portal Setup Script for Windows

echo 🚀 Setting up Swachh Netra Admin Web Portal...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 16+ and try again.
    pause
    exit /b 1
) else (
    echo [SUCCESS] Node.js is installed
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed. Please install npm and try again.
    pause
    exit /b 1
) else (
    echo [SUCCESS] npm is installed
)

echo.
echo [INFO] Installing root dependencies...
call npm install

echo.
echo [INFO] Installing backend dependencies...
cd backend
call npm install
cd ..

echo.
echo [INFO] Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo [INFO] Setting up environment files...

REM Backend environment
if not exist "backend\.env" (
    copy "backend\.env.example" "backend\.env"
    echo [WARNING] Backend .env file created from example. Please update with your Firebase credentials.
) else (
    echo [WARNING] Backend .env file already exists.
)

REM Frontend environment
if not exist "frontend\.env" (
    copy "frontend\.env.example" "frontend\.env"
    echo [WARNING] Frontend .env file created from example. Please update with your Firebase credentials.
) else (
    echo [WARNING] Frontend .env file already exists.
)

echo.
echo [INFO] Creating necessary directories...
if not exist "logs" mkdir logs
if not exist "uploads" mkdir uploads
if not exist "backups" mkdir backups

echo.
echo 🎉 Setup completed successfully!
echo.
echo 📋 Next steps:
echo 1. Update environment variables in backend\.env and frontend\.env
echo 2. Configure Firebase credentials
echo 3. Run 'npm run dev' to start both frontend and backend
echo.
echo 📚 Available commands:
echo   npm run dev          - Start both frontend and backend
echo   npm run server       - Start backend only
echo   npm run client       - Start frontend only
echo   npm run build        - Build frontend for production
echo.
echo 🔗 URLs:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:5000
echo   Health:   http://localhost:5000/health
echo.
echo 📖 For more information, see README.md
echo.
pause
