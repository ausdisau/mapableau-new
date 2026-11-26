#!/usr/bin/env bash
# Probe the MapAble-Unified Replit deployment hostname.
set -euo pipefail

URL="${REPLIT_DEPLOY_URL:-https://map-able-unified.replit.app}"
REPLIT_EDITOR="https://replit.com/@ausdisau1/MapAble-Unified"

echo "Checking ${URL} ..."

body_file=$(mktemp)
trap 'rm -f "${body_file}"' EXIT
code=$(curl --silent --show-error --location --max-time 20 --output "${body_file}" --write-out '%{http_code}' "${URL%/}/") || exit 1

if grep -qi "live yet" "${body_file}"; then
  echo "Replit returned its unpublished-app placeholder (HTTP ${code})"
  exit 2
fi

if [[ "${code}" == "200" ]] && grep -Eqi '<title>MapAble[^<]*</title>' "${body_file}" && grep -Eq 'id="root"' "${body_file}"; then
  echo "MapAble Unified app shell responded (HTTP ${code})"
  exit 0
fi

if [[ "${code}" == "404" ]]; then
  echo "Status: NOT FOUND (HTTP 404 — Repl may be private, renamed, or undeployed)"
  echo "Repl editor: ${REPLIT_EDITOR}"
  echo "Production target for this repo: Vercel (ausdisau/mapableau-new)"
  exit 2
fi

echo "Status: unexpected (HTTP ${code})"
echo "Repl editor: ${REPLIT_EDITOR}"
exit 1
