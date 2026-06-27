@echo off
title NxtWave Portal Startup Launcher
cls
echo ===================================================
echo 🚀 NxtWave LMS and Student Management System Launcher
echo ===================================================
echo.
echo Please select how you would like to run the application:
echo.
echo [1] Run automatically using Docker Compose (Recommended)
echo [2] Install dependencies and run locally (Requires local PostgreSQL)
echo [3] Exit
echo.
set /p opt="Enter choice (1-3): "

if "%opt%"=="1" goto docker
if "%opt%"=="2" goto local
if "%opt%"=="3" goto exit
goto error

:docker
echo.
echo [1/3] Verifying Docker daemon and spinning up containers...
docker compose up --build
goto exit

:local
echo.
echo [1/4] Installing backend dependencies & generating Prisma Client...
cd backend
call npm install
call npx prisma generate
echo.
echo [2/4] Running DB migrations and seeding pre-hashed users...
call npx prisma db push
call npx prisma db seed
echo.
echo [3/4] Starting backend API and Socket server on port 5000...
start cmd /k "npm run dev"
echo.
echo [4/4] Installing frontend dependencies & starting Vite portal...
cd ../frontend
call npm install
call npm run dev
goto exit

:error
echo Invalid selection. Press any key to restart.
pause > null
goto start

:exit
echo.
echo Startup instructions completed. Thank you!
pause
