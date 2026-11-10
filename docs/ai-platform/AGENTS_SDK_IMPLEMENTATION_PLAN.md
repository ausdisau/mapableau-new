# MapAble Agents SDK implementation plan (adapted)

## Repository target

This workspace hosts the web app at **repo root** (`lib/`, `app/`). Scaffold modules live at:

```text
lib/ai/platform/agents-sdk/
tests/agents-sdk/
docs/ai-platform/AGENTS_SDK_*.md
```

## Governing rule

Adapter/refactor of existing governed capability work — not a new AI product domain. Feature freeze and W-AA-1 boundaries intact. All flags default OFF.

## Delivery waves

### A — SDK adapter foundation (done in this programme)

- Manager + specialist-as-tool topology
- Access → `runNavigatorProviderSearchTurn` only
- Care/Transport/Jobs/safeguarding/compliance fail closed
- Policy + approval unit tests
- Local MCP opt-in; forbidden on Vercel

### B — Navigator bridge + Iris memory

- `POST /api/navigator/pilot/agent-run` (session, pilot, tenant, participant, capability, consent)
- Return final text or opaque approval id — never raw RunState
- `lib/ai/memory/iris-agent-memory.ts` behind `MAPABLE_IRIS_AGENT_MEMORY_ENABLED=false`

### C — approval/resume

- Encrypted, tenant-scoped, short-TTL paused RunState (in-process bridge; schema review before durable table)
- Re-run capability/consent/kill-switch gates at resume

### D — evals

- Scaffold cases + Care blueprint cases (no auto-assign, no “best match”, hard constraints)

## Mobile

Do not put privileged Agents SDK or Iris credentials in mobile apps.
