@echo off
title FIBA 3x3 Scoreboard Platform
echo =======================================================
echo    MEMBUKA PLATFORM SCOREBOARD BASKET 3x3
echo =======================================================
echo.
echo Membuka Scoreboard di browser Anda...
echo.

where node >nul 2>nul
if %errorlevel% == 0 (
    echo Menggunakan local web server Node.js...
    node server.js
) else (
    echo Membuka file langsung di browser...
    start "" "index.html"
)
pause
