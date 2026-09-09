# Ask MapAble embedded assistant — Integration Guide

## Purpose

**Ask MapAble** is the participant-facing, AI-assisted guide embedded across the
production MapAble Next.js application (mapable.com.au). It reuses the existing
copilot API and Intelligence Fabric specialists. It is **not** a second chatbot
stack and does **not** call OpenAI from the browser.

## Authoritative production path

| Layer | Location |
| --- | --- |
| Site widget | `components/ask-mapable/*` (mounted from `components/providers.tsx`) |
| Full page | `/ask` → `components/copilot/CopilotPanel.tsx` |
| API | `POST /api/mapable/ask` |
| Manager enrichment | `lib/ask-mapable/*` |
| Intent / drafts / guardrails | `lib/copilot/*` |
| CareOS specialists (`@openai/agents`) | `intelligence/orchestrator.ts` + `intelligence/agents/*` |

## Legacy Replit twin (not production SoR)

The floating widget under `client/src/components/chatbot-widget/` and Express
routes `/api/chat/sessions` + `/api/chat/send` remain for the Replit twin /
compatibility tree. Do **not** extend them as the Vercel production source of
truth. UX patterns (Chat / Actions / History, voice edit-before-send, a11y)
were ported into the Next.js Ask MapAble widget.

See also: `docs/architecture/ask-mapable-convergence.md`.

## Feature flags

| Flag | Default | Effect |
| --- | --- | --- |
| `NEXT_PUBLIC_ASK_MAPABLE_EMBEDDED_ENABLED` | off | Mounts the site-wide widget when `"true"` |
| `ASK_MAPABLE_EMBEDDED_ENABLED` | follows public | Optional server kill-switch |
| `SEARCH_INTERPRETER_ENABLED` + AI Gateway keys | existing | LLM interpretation where already configured |

When the embedded flag is off: core MapAble and `/ask` remain available; no
widget chrome is shown; no broken controls remain.

## Authentication

Phase 1: the embedded widget is **authenticated only** (NextAuth session).
`POST /api/mapable/ask` remains authenticated for default context. Guest
provider-finder context is unchanged and limited. The client never supplies an
authoritative `userId` — the server session does.

## Tabs

- **Chat** — calls `POST /api/mapable/ask` with typed `pageContext` and recent
  messages. Local session history is stored in `sessionStorage` for the widget
  (not a second server memory database).
- **Actions** — support draft seed, transport, jobs, NDIS explanation, Talk to a
  person (`/contact`).
- **History** — recent local conversations; New conversation clears the active id.

## Human pathway

Talk to a person is always available. Requests matching human-help language
record an `AgentRun` with `humanReviewRequired` via
`lib/ask-mapable/human-handoff.ts` and point to `/contact` and
`/dashboard/safety`. Ask MapAble must not trap someone in an AI-only loop.

## Evidence and constraints

Hard access requirements (AND) are preserved — never silently relaxed to OR.
Evidence vocabulary: `KNOWN` / `UNKNOWN` / `CONFLICTING` / `NOT_APPLICABLE` with
provenance labels. Provider claims and AI inference are never presented as
MapAble verification or accreditation.

## Accessibility

- Launcher: 56×56, `aria-label`, `aria-expanded`, `aria-haspopup="dialog"`
- Panel: `role="dialog"`, Escape closes, focus returns to launcher
- Tabs: keyboard arrows; chat log `role="log"` with polite live region
- Pending text: “Ask MapAble is checking…” (not spinner-only)
- `prefers-reduced-motion` respected via Tailwind `motion-safe` / `motion-reduce`
- Typed input always works; voice remains optional and never auto-sends

## Model configuration

Do not hard-code models in UI. Ask uses the existing AI Gateway /
search-interpreter configuration. CareOS fabric uses existing `OPENAI_API_KEY`
paths. No additional Ask-only API key is introduced.

## Testing

- `tests/ask-mapable.test.ts` — constraints, evidence, routing, planner
- `tests/ask-mapable-widget.test.tsx` — launcher / Escape / empty state
- Existing `tests/copilot-intent.test.ts`, `tests/provider-finder-ask.test.ts`
- AI evals: `ask_mapable.*` scenarios in `lib/ai/platform/evaluations`

## Rollback

1. Unset / set `NEXT_PUBLIC_ASK_MAPABLE_EMBEDDED_ENABLED` to false — widget gone.
2. Revert the Ask MapAble PR if API behaviour regresses.
3. Do not re-enable Express `/api/chat/*` on Vercel as production SoR.
