@echo off
cd /d "%~dp0"
title Baustelle Controlling - Server

REM Pruefen, ob Node.js installiert ist
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo FEHLER: Node.js ist nicht installiert.
  echo Bitte von https://nodejs.org herunterladen, installieren und erneut versuchen.
  echo.
  pause
  exit /b 1
)

REM Benoetigte Pakete nur beim ersten Mal installieren
if not exist "node_modules\express" (
  echo Installiere benoetigte Pakete ^(nur beim ersten Start^)...
  call npm install
)

REM Browser nach kurzer Wartezeit oeffnen, waehrend der Server hochfaehrt
start "" /min cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3000"

echo.
echo ============================================================
echo   Baustelle Controlling laeuft.
echo   App im Browser: http://localhost:3000
echo.
echo   Dieses Fenster bitte GEOEFFNET lassen.
echo   Zum Beenden einfach dieses Fenster schliessen.
echo ============================================================
echo.

node server.js

echo.
echo Server wurde beendet.
pause
