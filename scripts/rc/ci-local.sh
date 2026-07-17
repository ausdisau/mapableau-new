#!/usr/bin/env bash
set -euo pipefail

pnpm install --frozen-lockfile
pnpm prisma validate
pnpm prisma generate
pnpm type-check
pnpm format:check
pnpm lint
pnpm test
pnpm test:golden-paths
pnpm build
