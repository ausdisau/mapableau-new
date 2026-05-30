#!/usr/bin/env bash
# Import MapAble-Unified from Replit into a sibling directory for review/merge.
# Replit: https://replit.com/@ausdisau1/MapAble-Unified
#
# Prerequisites:
#   - Git access to the Repl (Version control tab in Replit → copy git remote URL)
#   - Optional: REPLIT_GIT_URL override if the default remote fails
#
# Usage:
#   ./scripts/import-replit-unified.sh
#   REPLIT_GIT_URL='https://...' ./scripts/import-replit-unified.sh

set -euo pipefail

REPLIT_SLUG="${REPLIT_SLUG:-MapAble-Unified}"
REPLIT_OWNER="${REPLIT_OWNER:-ausdisau1}"
IMPORT_DIR="${IMPORT_DIR:-/tmp/mapable-unified-replit}"
DEFAULT_GIT_URL="https://replit.com/@${REPLIT_OWNER}/${REPLIT_SLUG}.git"
GIT_URL="${REPLIT_GIT_URL:-$DEFAULT_GIT_URL}"

echo "MapAble Unified — Replit import"
echo "  Source: https://replit.com/@${REPLIT_OWNER}/${REPLIT_SLUG}"
echo "  Target: ${IMPORT_DIR}"
echo ""

if [[ -d "${IMPORT_DIR}/.git" ]]; then
  echo "Existing clone found; fetching latest..."
  git -C "${IMPORT_DIR}" fetch --all --prune
  git -C "${IMPORT_DIR}" pull --ff-only || true
else
  echo "Cloning from ${GIT_URL} ..."
  if ! git clone "${GIT_URL}" "${IMPORT_DIR}" 2>/dev/null; then
    echo ""
    echo "Clone failed. Replit git often requires authentication or a URL from the Repl UI."
    echo "Steps:"
    echo "  1. Open https://replit.com/@${REPLIT_OWNER}/${REPLIT_SLUG}"
    echo "  2. Tools → Version control → copy the HTTPS git remote"
    echo "  3. Re-run: REPLIT_GIT_URL='<your-remote>' ./scripts/import-replit-unified.sh"
    echo ""
    echo "After clone, compare with this monorepo:"
    echo "  diff -ru ${IMPORT_DIR}/app /workspace/app 2>/dev/null | head"
    echo "  diff -ru ${IMPORT_DIR}/prisma /workspace/prisma 2>/dev/null | head"
    exit 1
  fi
fi

echo ""
echo "Clone ready at ${IMPORT_DIR}"
echo "Suggested merge targets in mapableau-new:"
echo "  Hub:    app/core/, components/core/, lib/core-ui/"
echo "  Auth:   lib/auth/, app/api/auth/"
echo "  Modules: app/lib/modules.ts, app/care/, app/transport/, app/employment/"
echo "  Schema: prisma/schema.prisma (unified single schema)"
echo "  Docs:   docs/mapable/core-phases.md"
echo ""
echo "See docs/operations/replit-mapable-unified-import.md for the full checklist."
