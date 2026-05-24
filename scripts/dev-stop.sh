#!/usr/bin/env bash
PORT="${1:-3000}"
fuser -k "${PORT}/tcp" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
echo "Stopped processes on port ${PORT}."
