@echo off
cd /d "%~dp0"
echo Erstelle Desktop-Icon "Baustelle Controlling"...

REM Icon nur verwenden, wenn die Datei vorhanden ist (sonst Standard-Icon)
set "ICON="
if exist "%~dp0baustelle.ico" set "ICON=%~dp0baustelle.ico,0"

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws=New-Object -ComObject WScript.Shell; $d=[Environment]::GetFolderPath('Desktop'); $l=$ws.CreateShortcut((Join-Path $d 'Baustelle Controlling.lnk')); $l.TargetPath='%~dp0Baustelle starten.bat'; $l.WorkingDirectory='%~dp0'; if('%ICON%' -ne ''){ try { $l.IconLocation='%ICON%' } catch {} }; $l.Description='Baustelle Controlling starten'; $l.Save(); Write-Host 'Fertig! Das Icon liegt jetzt auf dem Desktop.'"

echo.
echo Falls oben ein Fehler stand: einfach trotzdem das Icon
echo "Baustelle Controlling" auf dem Desktop verwenden - es startet die App
echo auch ohne das Helm-Symbol.
echo.
pause
