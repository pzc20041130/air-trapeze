@echo off
setlocal
cd /d "%~dp0"

powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 8130 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
if not errorlevel 1 (
  start "" "http://127.0.0.1:8130/"
  exit /b 0
)

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js not found. Trying Python...
  where python >nul 2>nul
  if errorlevel 1 (
    echo Please install Node.js or Python first.
    pause
    exit /b 1
  )
  start "" /min cmd /c "python -m http.server 8130 --bind 127.0.0.1"
  timeout /t 2 >nul
  start "" "http://127.0.0.1:8130/"
  exit /b 0
)

start "" /min cmd /c "node server.js 8130"
powershell -NoProfile -Command "$ok=$false; for($i=0;$i -lt 40;$i++){ if(Get-NetTCPConnection -LocalPort 8130 -State Listen -ErrorAction SilentlyContinue){$ok=$true;break}; Start-Sleep -Milliseconds 250 }; if(-not $ok){exit 1}"
if errorlevel 1 (
  echo Local server failed to start.
  pause
  exit /b 1
)
start "" "http://127.0.0.1:8130/"
exit /b 0
