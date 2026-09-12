# Ask MapAble — Architecture Convergence Plan

Status: **implementing** (Phase 0 complete). This document records the production architecture decision and the convergence plan. It is not a capability claim for unshipped behaviour.

## Phase 0 findings (authoritative vs legacy)

| Concern | AUTHORITATIVE (Vercel / Next.js) | LEGACY (do not extend as SoR) |
| --- | --- | --- |
| App tree | Root `app/`, `components/`, `lib/`, `intelligence/`, `prisma/` | `client/` (Vite), `server/` (Express), `scripts/server/`, `ports/mapableau-new/` |
| Ask UI | `/ask` → `components/copilot/CopilotPanel.tsx` + contextual panels | `client/src/components/chatbot-widget/*` (Replit twin only) |
| Web AI API | **`POST /api/mapable/ask`** | Express `/api/chat/sessions`, `/api/chat/send` |
| Model path (Ask) | AI Gateway via `AI_GATEWAY_API_KEY` / `VERCEL_AI_GATEWAY_API_KEY` (`lib/config/search-interpreter.ts`, `lib/ai/platform/models/gateway.ts`) | `AI_INTEGRATIONS_OPENAI_*` in `server/chat/engine.ts` |
| CareOS / `@openai/agents` | `OPENAI_API_KEY` + `MAPABLE_AI_*`; `intelligence/orchestrator.ts` | — |
| Site-wide widget | **Not mounted** in Next production | Floating widget in `client/src/App.tsx` only |
| Sessions | Ask uses client `sessionId`; no Next `/api/chat/sessions` | Prisma/Express `chat_sessions` |

### Answers to Phase 0 checklist

1. **Production build tree:** Next.js App Router at repo root (Vercel).
2. **Live chat implementation:** Copilot / Ask via `POST /api/mapable/ask` and `/ask`.
3. **`client/` + `server/`:** Compatibility / Replit twin — keep for sync; do not treat as production SoR.
4. **Web AI route:** `POST /api/mapable/ask` (plus specialised chat routes for provider-finder stream, understanding, Slack).
5. **OpenAI env (Ask):** AI Gateway keys; CareOS fabric separately uses `OPENAI_API_KEY`. Do **not** add a third key convention.
6. **Widget mounted in prod?** No floating Ask widget on mapable.com.au today.
7. **Authoritative agent manager:** Ask uses deterministic `classifyIntent` + `planCopilotActions` + guardrails; CareOS uses `mapAbleOrchestrator` (`@openai/agents`).
8. **Frontend exposure:** Ask MapAble is linked in Core nav and on `/ask`; not site-wide floating.
9. **Tests:** `tests/copilot-intent.test.ts`, `tests/provider-finder-ask.test.ts`, `tests/ask-page-client.test.tsx`, AI platform evals.
10. **Duplicates:** Do not revive Express chat as production; port widget UX patterns into Next components calling `/api/mapable/ask`.

## Convergence target

```text
Visitor / participant
        |
        v
Ask MapAble embedded widget (Next.js)  — flag-gated
        |
        v
POST /api/mapable/ask  (existing auth + rate limits)
        |
        v
Identity + consent + page context (typed, minimal)
        |
        v
Ask MapAble manager layer (persona + constraint policy + specialist routing hints)
        |
        +---------------------------+
        |                           |
        v                           v
Deterministic tools / planners    Specialist agents (Intelligence Fabric when enabled)
        |
        v
Policy / confirmation / human handoff
        |
        v
Audit (AgentRun) + user-visible result
```

## Explicit non-goals

- No `/api/public-agent`
- No second OpenAI API key / client in the browser
- No duplicate Access / Transport / Jobs / safeguarding engines
- No weakening auth on `/api/mapable/ask` for anonymous general chat
- No deletion of Replit twin merely because Next superseded it

## Implementation slices

1. **Architecture seam** — `lib/ask-mapable/*` types, flags, page context, evidence vocabulary, docs (this file).
2. **Persona + routing** — wire manager layer into ask route / planner / guardrails; preserve hard access constraints; human-help intent.
3. **Widget** — Next.js Ask MapAble floating UI (Chat / Actions / History), design tokens, route-aware starters; mount behind fail-closed flag.
4. **Human pathway** — visible Talk to a person → AgentRun handoff + `/contact` / safety links.
5. **Privacy** — minimise logged payloads; document tracing assumptions.
6. **Tests + evals** — API security, constraint/evidence/injection, widget a11y unit tests, eval scenarios.
7. **Documentation** — update `docs/chatbot-widget-integration.md` and fabric docs to describe production path.

## Feature flags

| Flag | Default | Role |
| --- | --- | --- |
| `NEXT_PUBLIC_ASK_MAPABLE_EMBEDDED_ENABLED` | off (fail closed) | Mount site-wide widget |
| Existing `SEARCH_INTERPRETER_ENABLED` + gateway keys | unchanged | LLM-backed interpretation where already used |
| CareOS / `MAPABLE_AI_*` | unchanged | Intelligence Fabric specialists |

## Rollback

1. Set `NEXT_PUBLIC_ASK_MAPABLE_EMBEDDED_ENABLED` unset/`false` — widget unmounts; `/ask` and core MapAble remain.
2. Revert this branch / PR if API behaviour regresses.
3. Do not flip Express `/api/chat/*` back on for Vercel production.
