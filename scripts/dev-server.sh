#!/usr/bin/env bash
# Start MapAble dev server on port 3000 (matches .env localhost URLs).
set -euo pipefail

PORT="${PORT:-3000}"
HOST="${HOST:-0.0.0.0}"

echo "Stopping anything on port ${PORT}…"
if command -v fuser >/dev/null 2>&1; then
  fuser -k "${PORT}/tcp" 2>/dev/null || true
fi
if command -v lsof >/dev/null 2>&1; then
  lsof -ti:"${PORT}" | xargs -r kill -9 2>/dev/null || true
fi
pkill -f "next dev.*-p ${PORT}" 2>/dev/null || true
pkill -f "next dev.*--port ${PORT}" 2>/dev/null || true

sleep 1

if command -v fuser >/dev/null 2>&1 && fuser "${PORT}/tcp" 2>/dev/null; then
  echo "Error: port ${PORT} is still in use. Run: fuser -k ${PORT}/tcp"
  exit 1
fi

echo "Starting Next.js on http://${HOST}:${PORT} (use pnpm, not npm install)"
exec pnpm exec next dev --turbopack -H "${HOST}" -p "${PORT}"
