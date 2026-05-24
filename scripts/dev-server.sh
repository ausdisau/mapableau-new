#!/usr/bin/env bash
# Start MapAble dev server on port 3000 (matches .env localhost URLs).
set -euo pipefail

PORT="${PORT:-3000}"
HOST="${HOST:-0.0.0.0}"

if command -v fuser >/dev/null 2>&1; then
  fuser -k "${PORT}/tcp" 2>/dev/null || true
elif command -v lsof >/dev/null 2>&1; then
  lsof -ti:"${PORT}" | xargs -r kill -9 2>/dev/null || true
fi

sleep 1

exec pnpm exec next dev --turbopack -H "${HOST}" -p "${PORT}"
