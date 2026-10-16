@echo off
title MV GREENTECH INDUSTRIAL CRM Launcher
color 0B
echo ========================================================
echo        MV GREENTECH PVT LTD - INDUSTRIAL CRM
echo ========================================================
echo.
echo Starting Backend API Server (Port 5000)...
start "CRM Backend" cmd /k "cd /d %~dp0backend && npm run dev"

echo Starting Frontend Web Application (Port 5173)...
start "CRM Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Launching browser in 3 seconds...
timeout /t 3 >nul
start http://localhost:5173/login

echo.
echo ========================================================
echo   CRM is running!
echo   Web Portal URL: http://localhost:5173
echo   Backend URL:    http://localhost:5000
echo ========================================================
pause
