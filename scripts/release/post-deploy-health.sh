#!/usr/bin/env bash
# Post-deploy health: require live + ready JSON probes (not the stub /api/health).
set -euo pipefail

BASE_URL="${HEALTH_CHECK_BASE_URL:-http://localhost:3000}"
BASE_URL="${BASE_URL%/}"

echo "==> Post-deploy health check against ${BASE_URL}"

curl_json() {
  local path="$1"
  local tmp
  tmp="$(mktemp)"
  local code
  code="$(
    curl -sS -o "${tmp}" -w "%{http_code}" \
      --max-time 30 \
      "${BASE_URL}${path}" || echo "000"
  )"
  echo "${code}"$'\t'"$(cat "${tmp}")"
  rm -f "${tmp}"
}

check_probe() {
  local path="$1"
  local expected_status="$2"
  local expected_body_substr="$3"
  local row http_code body

  row="$(curl_json "${path}")"
  http_code="${row%%$'\t'*}"
  body="${row#*$'\t'}"

  echo "  ${path} → HTTP ${http_code} body=${body}"

  if [[ "${http_code}" != "${expected_status}" ]]; then
    echo "FAIL: ${path} expected HTTP ${expected_status}, got ${http_code}"
    return 1
  fi
  if ! echo "${body}" | grep -qF "${expected_body_substr}"; then
    echo "FAIL: ${path} body missing ${expected_body_substr}"
    return 1
  fi
  return 0
}

failed=0
check_probe "/api/health/live" "200" '"status":"ok"' || failed=1
check_probe "/api/health/ready" "200" '"status":"ready"' || failed=1

if [[ "${failed}" -ne 0 ]]; then
  echo "==> Post-deploy health check FAILED"
  exit 1
fi

echo "==> Post-deploy health check passed (live + ready)"
