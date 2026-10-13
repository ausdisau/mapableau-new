#!/usr/bin/env bash
# Idempotent dependency install for Cursor Cloud Agents (runs from repo root via environment.json).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

export HUSKY=0

pnpm install
pnpm exec prisma generate
