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
  echo 未找到 Node.js，尝试使用 Python 启动...
  where python >nul 2>nul
  if errorlevel 1 (
    echo 请安装 Node.js 或 Python 后再运行。
    pause
    exit /b 1
  )
  start "" "http://127.0.0.1:8130/"
  python -m http.server 8130 --bind 127.0.0.1
  goto :eof
)
start "" "http://127.0.0.1:8130/"
node server.js 8130
endlocal
