@echo off
cd /d "%~dp0"
echo Erstelle Desktop-Icon "Baustelle Controlling"...

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ws=New-Object -ComObject WScript.Shell; $d=[Environment]::GetFolderPath('Desktop'); $l=$ws.CreateShortcut((Join-Path $d 'Baustelle Controlling.lnk')); $l.TargetPath='%~dp0Baustelle starten.bat'; $l.WorkingDirectory='%~dp0'; $l.IconLocation='%~dp0baustelle.ico'; $l.WindowStyle=1; $l.Description='Baustelle Controlling starten'; $l.Save(); Write-Host 'Fertig! Das Icon liegt jetzt auf dem Desktop.'"

echo.
echo Du kannst dieses Fenster schliessen. Ab jetzt einfach das Icon
echo "Baustelle Controlling" auf dem Desktop anklicken.
echo.
pause
