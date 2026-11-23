# MapAble Search — Accessible streaming conversation v0.1

**Delivery state:** implemented on a draft branch; not independently verified live.
**Base:** `main` at `b805d8819371895a75deb8ecbd921525cf4144bc` (PR #738 was merged).
**Target:** `/search?presentation=conversation` within the existing MapAble marketing shell.

## Decision and bounded user outcome

Make public MapAble search behave like a dialogue **without inventing AI certainty**:
a person submits one question, receives source-labelled progress, sees results
as they arrive, can stop/retry, edit the next question, and follow human
assistance. The familiar Web / Conversation and Quick / Deep controls remain.

This first vertical slice is **deterministic, not a generative LLM**.
The server reuses `searchMapAble` (public module navigation and an optional
imported provider directory). It streams evidence-labelled sentences from
code, not model-generated answers.

### Source evidence and status

- `app/(marketing)/search/page.tsx` and `components/search/*` existed in
  merged PR #738; do not create a second `/search` route.
- `lib/search/mapable-search-service.ts` is the approved public source
  boundary and already respects `MAPABLE_SEARCH_PROVIDER_INDEX_ENABLED`.
- PR #737 still contains separate, unmerged Companion and federated
  Neon/Supabase exploration. **Do not depend on PR #737 for this slice.**
- No real coordinates, slopes, ceiling-hoist measurements or current worker
  screening are supplied by the above public Search service.
- Search ad placement stays separate in the existing results component;
  it is not an input to any search query or answer.
- No private profile, NDIS plan, user auth, AI API key or payment token is
  requested or loaded.

## User journey and states

1. Open `/search?presentation=conversation`. If UI flag is disabled,
   the existing guided-search implementation appears unchanged.
2. In streaming preview, enter a query in the existing Search form or
   select an AAC-friendly suggestion to put text into a separate composer.
3. Check the explicit public-server processing notice. No request starts
   merely from ticking the box or selecting a suggestion.
4. Search sends a validated, bounded POST. If the server feature flag is off,
   the UI reports the preview unavailable and offers Web Search/human help.
5. Receive typed `search.started`, `source.found`, `result.upsert`,
   `message.delta`, `spatial.updated`, `search.completed` or
   `search.error` events. The same reducer updates results and dialogue.
6. A new question **replaces** the query; it is not silently interpreted as
   an AI follow-up or blended with private conversational memory.
   Up to four earlier questions remain in component memory on the page only.
7. Stop aborts the current fetch; Retry repeats the same reviewed query;
   Clear resets conversation memory. Unchecking consent cancels and clears.
8. If data is unavailable or empty, present uncertainty and direct links
   to conventional Search, Provider Finder and human assistance.

### UI principles

- 45% conversation / 55% results on wide screens; vertically stacked at
  narrow viewports.
- The result card is reused from `MapAbleSearchResults`, including source,
  evidence status, unverified registration and worker screening,
  unknown access fit, correction link and human support.
- 2D map and 3D view controls are visible but disabled. No speculative pins,
  routes, floorplans or accessibility scores. The existing list is the
  accessible equivalent for the first slice.
- The public search consent is explicit; it is **not** an authenticated,
  revocable consent receipt or permission to process regulated records.
- Never auto-load AccessibilityPreferenceCard or expose NDIS plans here.
  An eventual authenticated version needs scoped AD.iD consent and a
  documented purpose/retention boundary first.
- The streamed text uses `aria-live="off"`; only meaningful progress and
  completion go into a polite, atomic status region. Avoid announcing every
  chunk or moving focus while typing.
- Quick is free. Deep/Credits remains disabled without a server-side
  spend reservation, budget and reconciliation ledger.
- Follow-ups are explicit, separate requests; user can correct them.

## Implementation map

| File | Responsibility |
| --- | --- |
| `lib/search/mapable-stream-contract.ts` | Zod request/event schemas, SSE encoding/parser, shared client reducer |
| `app/api/mapable-search/stream/route.ts` | default-disabled, bounded Node stream; public service only |
| `components/search/MapAbleStreamingWorkspace.tsx` | split workspace, chat composer, AAC chips, consent/stop/retry, synchronised results |
| `components/search/MapAbleSearchHero.tsx` | select streaming workspace only with UI flag |
| `components/search/MapAbleSearchForm.tsx` | optional navigation-free submit for in-place streaming |
| `app/(marketing)/search/page.tsx` | suppress pre-consent server prefetch for streaming conversation mode |
| `tests/mapable-search-stream*.test.ts*` | schema, parser, reducer, route and UI boundaries |
| `.github/workflows/mapable-search-streaming-focused.yml` | isolated tests and feature lint; not a release bypass |

### POST contract

`POST /api/mapable-search/stream`, `Content-Type: application/json`.

```json
{
  "message": "Find accessible clinics",
  "vertical": "care",
  "publicSearchApproved": true
}
```

**Response:** `text/event-stream`, `Cache-Control: no-store, no-transform`.
Each event is `data: <JSON>\n\n`.

```text
data: {"type":"search.started","requestId":"..."}
data: {"type":"source.found","label":"MapAble public module navigation"}
data: {"type":"result.upsert","result":{...}}
data: {"type":"message.delta","text":"I found ..."}
data: {"type":"spatial.updated","available":false,"explanation":"..."}
data: {"type":"search.completed","resultCount":1,"sourceState":"navigation_only","warnings":[]}
```

The actual emitted SSE events are separated by blank lines; the above
is a compact illustrative event inventory, not a literal transcript.
The query schema rejects extra fields such as participant IDs, worker
identities, NDIS plan content, access preferences and ad bids.

### Feature flags — all OFF

```env
NEXT_PUBLIC_MAPABLE_SEARCH_STREAM_UI_ENABLED=false
MAPABLE_SEARCH_STREAM_ENABLED=false
MAPABLE_SEARCH_STREAM_DISTRIBUTED_GATE_VERIFIED=false
MAPABLE_SEARCH_PROVIDER_INDEX_ENABLED=false
```

For a **synthetic-only preview**, set UI and server-stream flags to
`true` in a reviewed preview environment. Do not enable production.
For a production deployment, the route also requires an explicit
`MAPABLE_SEARCH_STREAM_DISTRIBUTED_GATE_VERIFIED=true` claim; that
environment flag is only a *release assertion*, **not** a rate limiter.
It may only be enabled after confirming real distributed ingress rate
limiting, monitoring, request timeouts, consent/privacy review and abuse
protection. The existing `checkIpRateLimit` is process-local.

Do not install new LLM, ChatBotKit, jQuery, database, maps or vendor packages
for this initial slice.

## Tests and acceptance gates

```bash
pnpm install --frozen-lockfile
pnpm exec prisma generate
pnpm exec vitest run tests/mapable-search-stream.test.ts tests/mapable-search-stream-route.test.ts tests/mapable-search-stream-ui.test.tsx
pnpm exec vitest run tests/mapable-search-ui.test.tsx tests/mapable-search-discovery.test.ts
pnpm lint
pnpm type-check
pnpm build
pnpm test:a11y
```

Focused CI adds independent tests; full repository CI, Quality, Security,
CSP, Accessibility, CodeQL, preview smoke checks and production domain checks
remain required.

Additional human tests: keyboard and switch, AAC input (including slow
composition), screen reader (no token flood), 200% zoom/320px reflow,
no-color-only state, reduced motion, long titles, server failure, abort/retry,
blank input, duplicate events, stale requests, user correction and
anonymous navigation. Test with people with diverse access requirements.

Security and privacy gates: verify production public-data licence, no
private-data or ad leakage, abuse controls, no query logging, cancellation,
source injection safety, optional API retention and Australian data
residency. Do not enable profile import, paid Deep Search, provider booking,
participant record search, automatically determined NDIS eligibility,
verified worker clearance, auto-rated places or autonomous transport
routing without independent approvals.

## Next iteration — not yet implemented

- Approved AI streaming through a separate typed assistant adapter,
  per-turn opt-in, model/tool cost reservation, source-grounded response
  validation and constrained tool handoffs. Never reuse a public-search
  checkbox as blanket consent for external model processing.
- Source-backed access observations with freshness, measured entrance,
  slope, hoist/sensory evidence, disputes and reviewer notes.
- 2D mapping and optional 3D floorplan view only when real geocoded or
  measured geometry exists; always preserve list and transcript.
- Account-scope consent to selectively apply AccessibilityPreferenceCard.
- Evidence-aware matching by hard requirements; never hide other options
  without an explicit user-controllable warning.
- Optional inclusive multilingual/AAC phrase libraries and accessible
  human-supported co-browsing.

## Release decision

**Review-only.** Commit to a draft PR; run focused checks and do not merge,
promote, configure secrets, modify Vercel domain aliases or deploy the
stream until gates are independently satisfied.
