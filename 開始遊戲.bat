@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul && py -m http.server 8765 || python -m http.server 8765
