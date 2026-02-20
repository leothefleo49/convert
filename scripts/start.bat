@echo off
title Convert Anything — Offline Mode
echo.
echo  ================================================
echo   Convert Anything — Starting Offline Server...
echo  ================================================
echo.

:: Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo  ERROR: Node.js is not installed on this computer.
    echo.
    echo  Please install it from:  https://nodejs.org
    echo  Choose the LTS version ^(Recommended For Most Users^).
    echo  Then run this file again.
    echo.
    pause
    exit /b 1
)

:: Show Node.js version
for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo  Node.js found: %NODE_VER%
echo.
echo  Starting server... your browser should open automatically.
echo  If it doesn't, open:  http://localhost:8080/
echo.
echo  Press Ctrl+C to stop the server.
echo.

node "%~dp0serve.js"
pause
