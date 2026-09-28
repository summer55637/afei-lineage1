@echo off
setlocal
cd /d "%~dp0"
set "URL=http://127.0.0.1:8765/game.html"

start "Afei V2.70 Server" /min powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve-v270.ps1"

powershell.exe -NoProfile -Command "$u='%URL%'; for($i=0;$i -lt 20;$i++){ try{ $r=Invoke-WebRequest -UseBasicParsing -Uri $u -TimeoutSec 1; if($r.StatusCode -eq 200){ Start-Process $u; exit 0 } } catch{}; Start-Sleep -Seconds 1 }; exit 1"
if errorlevel 1 (
  echo.
  echo 無法啟動本機遊戲伺服器。
  echo 請確認 Windows PowerShell 可用，或檢查 8765 連接埠是否被占用。
  pause
  exit /b 1
)
exit /b 0
