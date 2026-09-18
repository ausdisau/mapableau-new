#!/usr/bin/env bash
set -Eeuo pipefail

API_BASE="${OPENAI_API_BASE:-https://api.openai.com/v1}"
PROJECT_ID="${OPENAI_PROJECT_ID:-proj_aRYSx2ldlGChWX1AGcPdwfv0}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENT_FILE="${AGENT_FILE:-$SCRIPT_DIR/agent.json}"
INITIAL_MESSAGE="${1:-Hello. Introduce yourself briefly and explain how you can help with MapAble development.}"

die() { printf 'error: %s\n' "$*" >&2; exit 1; }
command -v curl >/dev/null || die "curl is required"
command -v jq >/dev/null || die "jq is required"
[[ -n "${OPENAI_API_KEY:-}" ]] || die "OPENAI_API_KEY is not set"
[[ -r "$AGENT_FILE" ]] || die "agent definition not found: $AGENT_FILE"

auth=(-H "Authorization: Bearer $OPENAI_API_KEY" -H "OpenAI-Project: $PROJECT_ID")
json=(-H "Content-Type: application/json")
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
session_id=""

api_json() {
  local method="$1" url="$2" data="${3:-}" out="$tmp/body.json" code
  if [[ -n "$data" ]]; then
    code="$(curl -sS -o "$out" -w '%{http_code}' -X "$method" "${auth[@]}" "${json[@]}" --data "$data" "$url")"
  else
    code="$(curl -sS -o "$out" -w '%{http_code}' -X "$method" "${auth[@]}" "$url")"
  fi
  if (( code < 200 || code >= 300 )); then
    printf 'OpenAI API request failed (HTTP %s):\n' "$code" >&2
    jq . "$out" >&2 2>/dev/null || cat "$out" >&2
    return 1
  fi
  cat "$out"
}

printf 'Creating reusable agent in project %s...\n' "$PROJECT_ID"
agent="$(api_json POST "$API_BASE/agents" "$(cat "$AGENT_FILE")")"
agent_id="$(jq -er '.id' <<<"$agent")"
printf 'Agent ID: %s\n' "$agent_id"

submit_tool_result() {
  local action="$1" turn_id call_id name result payload
  [[ -n "$session_id" ]] || die "cannot submit a tool result before the session ID is known"
  turn_id="$(jq -er '.turn_id' <<<"$action")"
  call_id="$(jq -er '.call_id' <<<"$action")"
  name="$(jq -r '.name // "unknown"' <<<"$action")"

  # No functions are enabled in agent.json today. This fail-closed executor prevents
  # an unexpected function call from being silently executed. Add explicit cases here
  # only when a reviewed function tool is added to the reusable agent.
  result="Tool '$name' is not registered in this executor."
  payload="$(jq -nc --arg turn_id "$turn_id" --arg call_id "$call_id" --arg error "$result"     '{events:[{type:"agent.session.input.tool_result",turn_id:$turn_id,call_id:$call_id,success:false,error:$error}]}')"
  api_json POST "$API_BASE/agents/sessions/$session_id/events" "$payload" >/dev/null
  printf '\n[tool] rejected unregistered function: %s\n' "$name" >&2
}

handle_event_json() {
  local event="$1" type
  type="$(jq -r '.type // empty' <<<"$event")"
  case "$type" in
    agent.session.created)
      session_id="$(jq -er '.session.id' <<<"$event")"
      printf 'Session ID: %s\n\n' "$session_id" >&2
      ;;
    agent.session.turn.output_text.delta)
      jq -jr '.delta // empty' <<<"$event"
      ;;
    agent.session.requires_action)
      while IFS= read -r action; do submit_tool_result "$action"; done < <(jq -c '.session.required_actions[]?' <<<"$event")
      ;;
    agent.session.error|agent.session.failed|agent.session.turn.failed)
      printf '\n[OpenAI event error] %s\n' "$(jq -c '.' <<<"$event")" >&2
      ;;
    *)
      printf '[event] %s\n' "$type" >&2
      ;;
  esac
}

session_payload="$(jq -nc --arg agent_id "$agent_id" --arg input "$INITIAL_MESSAGE"   '{agent_id:$agent_id,environment:{type:"none"},input:$input,stream:true,metadata:{app:"mapable-agents-api-curl"}}')"

printf 'Starting and streaming session...\n'
# Creating a session with stream:true returns Server-Sent Events immediately, which
# avoids racing a second GET /events request against a fast first turn.
while IFS= read -r line; do
  case "$line" in
    data: *)
      data="${line#data: }"
      [[ "$data" == "[DONE]" ]] && break
      if jq -e . >/dev/null 2>&1 <<<"$data"; then
        handle_event_json "$data"
      else
        printf '[stream] malformed JSON: %s\n' "$data" >&2
      fi
      ;;
  esac
done < <(
  curl --fail-with-body -sS -N     -X POST     "${auth[@]}"     "${json[@]}"     -H "Accept: text/event-stream"     --data "$session_payload"     "$API_BASE/agents/sessions"
)

[[ -n "$session_id" ]] || die "stream ended before an agent.session.created event was received"

printf '\n\nSession complete. Inspect items with:\n'
printf 'curl -sS -H "Authorization: Bearer $OPENAI_API_KEY" -H "OpenAI-Project: %s" "%s/agents/sessions/%s/items" | jq .\n' "$PROJECT_ID" "$API_BASE" "$session_id"
