@echo off
set "PYTHONUTF8=1"
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 22 or later from https://nodejs.org and run this file again.
  pause
  exit /b 1
)
where py >nul 2>nul
if errorlevel 1 (
  echo Install Python 3.11 or later from https://python.org and run this file again.
  pause
  exit /b 1
)
if not exist ".venv\Scripts\python.exe" py -3 -m venv .venv
if errorlevel 1 goto error
.venv\Scripts\python.exe -m pip install -r requirements.txt
if errorlevel 1 goto error
.venv\Scripts\python.exe -X utf8 -m engine.testing
if errorlevel 1 goto error
exit /b 0
:error
echo Gantry could not start. Keep the error above for troubleshooting.
pause
exit /b 1
