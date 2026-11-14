#!/usr/bin/env bash
# Sync Cursor ↔ ChatGPT/Codex via GitHub (shared Next.js surface).
#
# Usage:
#   ./scripts/sync-cursor-chatgpt-branches.sh report
#   ./scripts/sync-cursor-chatgpt-branches.sh ensure-bridge [--push]
#   ./scripts/sync-cursor-chatgpt-branches.sh refresh-from-main [--push]
#   ./scripts/sync-cursor-chatgpt-branches.sh handoff-pack
#
# Env:
#   SYNC_PUSH=1          Push after ensure/refresh (same as --push)
#   CHATGPT_BRANCH       Default: chatgpt-main
#   MAIN_BRANCH          Default: main
#   REPORT_DIR           Default: /tmp/cursor-chatgpt-branch-sync-report
#
# Docs: docs/operations/cursor-chatgpt-branch-sync.md

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

ACTION="${1:-report}"
shift || true

SYNC_PUSH="${SYNC_PUSH:-0}"
for arg in "$@"; do
  case "${arg}" in
    --push) SYNC_PUSH=1 ;;
    *)
      echo "Unknown argument: ${arg}" >&2
      exit 1
      ;;
  esac
done

REPORT_DIR="${REPORT_DIR:-/tmp/cursor-chatgpt-branch-sync-report}"
CHATGPT_BRANCH="${CHATGPT_BRANCH:-chatgpt-main}"
MAIN_BRANCH="${MAIN_BRANCH:-main}"

die() {
  echo "ERROR: $*" >&2
  exit 1
}

require_clean_or_confirm() {
  if [[ -n "$(git status --porcelain)" ]]; then
    die "Working tree is dirty. Commit or stash before ${ACTION}."
  fi
}

maybe_push_branch() {
  local branch="$1"
  if [[ "${SYNC_PUSH}" == "1" ]]; then
    git push -u origin "${branch}"
    echo "Pushed origin/${branch}"
  else
    echo "Push skipped (set SYNC_PUSH=1 or pass --push). Suggested: git push -u origin ${branch}"
  fi
}

remote_branch_exists() {
  local branch="$1"
  git ls-remote --exit-code --heads origin "${branch}" >/dev/null 2>&1
}

fetch_tips() {
  git fetch origin "${MAIN_BRANCH}" >/dev/null 2>&1 || die "Cannot fetch origin/${MAIN_BRANCH}"
  if remote_branch_exists "${CHATGPT_BRANCH}"; then
    git fetch origin "${CHATGPT_BRANCH}" >/dev/null 2>&1 || true
  fi
}

list_open_prs_by_prefix() {
  local prefix="$1"
  local label="$2"
  if ! command -v gh >/dev/null 2>&1; then
    echo "  (gh CLI unavailable — skip ${label} PR list)"
    return 0
  fi
  local json
  if ! json="$(gh pr list --state open --limit 100 --json number,title,headRefName,updatedAt,url 2>/dev/null)"; then
    echo "  (gh pr list failed — skip ${label})"
    return 0
  fi
  echo "${json}" | python3 -c "
import json, sys
prefix = sys.argv[1]
label = sys.argv[2]
rows = json.load(sys.stdin)
matched = [r for r in rows if r.get('headRefName', '').startswith(prefix)]
print(f'  {label}: {len(matched)} open PR(s) with head starting {prefix!r}')
for r in sorted(matched, key=lambda x: x.get('updatedAt') or '', reverse=True)[:25]:
    print(f\"    #{r['number']} {r['headRefName']} — {r['title']}\")
    print(f\"         {r.get('url', '')}\")
" "${prefix}" "${label}"
}

run_report() {
  fetch_tips
  mkdir -p "${REPORT_DIR}"
  local summary="${REPORT_DIR}/summary.txt"
  local main_sha
  main_sha="$(git rev-parse --short "origin/${MAIN_BRANCH}")"

  {
    echo "Cursor ↔ ChatGPT (Codex) GitHub bridge report"
    echo "Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    echo "main:          origin/${MAIN_BRANCH} (${main_sha})"
    if remote_branch_exists "${CHATGPT_BRANCH}" || git rev-parse --verify "origin/${CHATGPT_BRANCH}" >/dev/null 2>&1; then
      local chatgpt_sha
      chatgpt_sha="$(git rev-parse --short "origin/${CHATGPT_BRANCH}")"
      echo "chatgpt bridge: origin/${CHATGPT_BRANCH} (${chatgpt_sha})"
      echo "Ahead/behind (chatgpt-main...main): $(git rev-list --left-right --count "origin/${CHATGPT_BRANCH}...origin/${MAIN_BRANCH}")"
      if [[ "${chatgpt_sha}" == "${main_sha}" ]]; then
        echo "Bridge status: IN SYNC with main"
      else
        echo "Bridge status: DRIFT — run: ./scripts/sync-cursor-chatgpt-branches.sh refresh-from-main --push"
      fi
    else
      echo "chatgpt bridge: MISSING origin/${CHATGPT_BRANCH}"
      echo "Bridge status: NOT CREATED — run: ./scripts/sync-cursor-chatgpt-branches.sh ensure-bridge --push"
    fi
    echo ""
    echo "Open PRs by agent prefix (GitHub is the sync unit):"
  } > "${summary}"

  {
    list_open_prs_by_prefix "cursor/" "Cursor"
    list_open_prs_by_prefix "codex/" "Codex"
    list_open_prs_by_prefix "chatgpt/" "ChatGPT"
    list_open_prs_by_prefix "feature/" "Feature (often ChatGPT)"
    list_open_prs_by_prefix "research/" "Research (often ChatGPT)"
  } >> "${summary}"

  {
    echo ""
    echo "Ops doc: docs/operations/cursor-chatgpt-branch-sync.md"
    echo "Protocol: PR → main, then refresh chatgpt-main. No second SoT."
  } >> "${summary}"

  cat "${summary}"
  echo ""
  echo "Report written to ${summary}"
}

run_ensure_bridge() {
  require_clean_or_confirm
  fetch_tips
  if remote_branch_exists "${CHATGPT_BRANCH}"; then
    echo "origin/${CHATGPT_BRANCH} already exists ($(git rev-parse --short "origin/${CHATGPT_BRANCH}"))."
    echo "Tip: refresh-from-main to align with origin/${MAIN_BRANCH}."
    return 0
  fi

  git branch -f "${CHATGPT_BRANCH}" "origin/${MAIN_BRANCH}"
  echo "Created local ${CHATGPT_BRANCH} at origin/${MAIN_BRANCH} ($(git rev-parse --short "origin/${MAIN_BRANCH}"))."
  maybe_push_branch "${CHATGPT_BRANCH}"
}

run_refresh_from_main() {
  require_clean_or_confirm
  fetch_tips

  if ! remote_branch_exists "${CHATGPT_BRANCH}"; then
    echo "origin/${CHATGPT_BRANCH} missing — creating from main first."
    git branch -f "${CHATGPT_BRANCH}" "origin/${MAIN_BRANCH}"
    maybe_push_branch "${CHATGPT_BRANCH}"
    return 0
  fi

  if git show-ref --verify --quiet "refs/heads/${CHATGPT_BRANCH}"; then
    git checkout "${CHATGPT_BRANCH}"
  else
    git checkout -B "${CHATGPT_BRANCH}" "origin/${CHATGPT_BRANCH}"
  fi

  git merge --ff-only "origin/${MAIN_BRANCH}" || die "Cannot fast-forward ${CHATGPT_BRANCH} to origin/${MAIN_BRANCH}. Resolve manually."
  echo "Fast-forwarded ${CHATGPT_BRANCH} → origin/${MAIN_BRANCH} ($(git rev-parse --short HEAD))."
  maybe_push_branch "${CHATGPT_BRANCH}"
}

run_handoff_pack() {
  fetch_tips
  mkdir -p "${REPORT_DIR}"
  local pack="${REPORT_DIR}/handoff-pack.md"
  local main_sha
  main_sha="$(git rev-parse --short "origin/${MAIN_BRANCH}")"
  local bridge_line="MISSING — run ensure-bridge --push"
  if git rev-parse --verify "origin/${CHATGPT_BRANCH}" >/dev/null 2>&1; then
    bridge_line="origin/${CHATGPT_BRANCH} ($(git rev-parse --short "origin/${CHATGPT_BRANCH}")) · ahead/behind vs main: $(git rev-list --left-right --count "origin/${CHATGPT_BRANCH}...origin/${MAIN_BRANCH}")"
  fi

  {
    echo "# Cursor ↔ ChatGPT handoff pack"
    echo ""
    echo "Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    echo ""
    echo "## Bridge tips"
    echo ""
    echo "- \`main\`: origin/${MAIN_BRANCH} (${main_sha})"
    echo "- \`chatgpt-main\`: ${bridge_line}"
    echo ""
    echo "## How to sync"
    echo ""
    echo "1. ChatGPT: \`git fetch origin && git checkout ${CHATGPT_BRANCH} && git pull --ff-only\` then branch \`codex/<topic>\`."
    echo "2. Cursor: \`git fetch origin && git checkout ${MAIN_BRANCH} && git pull --ff-only\` then branch \`cursor/<topic>-****\`."
    echo "3. After merge to main: \`./scripts/sync-cursor-chatgpt-branches.sh refresh-from-main --push\`."
    echo "4. Full protocol: \`docs/operations/cursor-chatgpt-branch-sync.md\`."
    echo ""
    echo "## Agent handoff template"
    echo ""
    echo '```markdown'
    echo "## Agent handoff (Cursor ↔ ChatGPT)"
    echo ""
    echo "- **From:** cursor | chatgpt"
    echo "- **To:** chatgpt | cursor | human"
    echo "- **Branch:** <head ref>"
    echo "- **Base:** main @ ${main_sha}"
    echo "- **Goal:** …"
    echo "- **Done:** …"
    echo "- **Do not change:** …"
    echo "- **Next steps:** …"
    echo "- **Tests run:** …"
    echo "- **Stop gates:** …"
    echo '```'
    echo ""
    echo "## Open PR inventory"
    echo ""
  } > "${pack}"

  {
    list_open_prs_by_prefix "cursor/" "Cursor"
    list_open_prs_by_prefix "codex/" "Codex"
    list_open_prs_by_prefix "chatgpt/" "ChatGPT"
    list_open_prs_by_prefix "feature/" "Feature (often ChatGPT)"
    list_open_prs_by_prefix "research/" "Research (often ChatGPT)"
  } >> "${pack}"

  cat "${pack}"
  echo ""
  echo "Handoff pack written to ${pack}"
}

case "${ACTION}" in
  report) run_report ;;
  ensure-bridge) run_ensure_bridge ;;
  refresh-from-main) run_refresh_from_main ;;
  handoff-pack) run_handoff_pack ;;
  *)
    echo "Usage: $0 {report|ensure-bridge|refresh-from-main|handoff-pack} [--push]" >&2
    exit 1
    ;;
esac
