#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
PORT=8765
URL="http://127.0.0.1:${PORT}/game.html"

if command -v curl >/dev/null 2>&1 && curl -fsS "$URL" >/dev/null 2>&1; then
  true
else
  python3 -m http.server "$PORT" --bind 127.0.0.1 >/tmp/afei-v270-server.log 2>&1 &
  PID=$!
  trap 'kill "$PID" 2>/dev/null || true' EXIT
  for _ in $(seq 1 20); do
    if curl -fsS "$URL" >/dev/null 2>&1; then break; fi
    sleep 1
  done
fi

if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$URL" >/dev/null 2>&1 &
elif command -v open >/dev/null 2>&1; then
  open "$URL" >/dev/null 2>&1 &
else
  echo "請開啟：$URL"
fi

echo "阿肥石器時代 V2.70：$URL"
wait 2>/dev/null || true
