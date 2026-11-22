# MapAble Access Assistant — embedded public companion slice

**Status:** proposed implementation, draft PR, flag OFF by default.
**Repository:** `ausdisau/mapableau-new` / existing Next.js 15 + TypeScript + Node.js application.
**Scope:** re-use the site-wide `AskMapAbleWidget` and existing `GuidedSearchDialogue`. No new identity, agent memory, regulated transaction, credit ledger or advertising surface.

## Decision

Extend the existing Ask MapAble widget into a single, accessible assistant for public
discovery and signed-in account support without embedding ChatGPT Dots or duplicating
the site's current assistant. This is **Dots-inspired**, not an OpenAI Dots integration.
OpenAI's ChatGPT GPTs/Dots are not the website embed API; the developer route is the
Agents SDK or a hosted ChatKit integration. The present site uses the existing
a deterministic no-AI guide by default, with existing
`@ai-sdk/react` search offered as a separately opted-in conversation.

## Baseline evidence

Directly inspected before this change:
- `components/providers.tsx` mounts `AskMapAbleWidget` site-wide.
- `AskMapAbleWidget.tsx` was authenticated-only behind
  `NEXT_PUBLIC_ASK_MAPABLE_EMBEDDED_ENABLED`.
- `app/api/mapable/ask/route.ts` contains authenticated routing, guards and
  participant checks; **untouched** by this PR.
- `components/guided-search/GuidedSearchDialogue.tsx` and
  `app/api/provider-finder/chat/route.ts` already support public guided search.
- `lib/ask-mapable/page-context.ts`, `persona.ts` and `constraint-policy.ts`
  encode context-aware suggestions and access safeguards.
- `lib/api/ip-rate-limit.ts` is a process-local, non-distributed limit; not a
  production-scale abuse guarantee.
- `AskMapAblePanel.tsx` provides Escape close, dialog semantics and focus return.
- `useAskLocalSessions` saves authenticated widget history in sessionStorage;
  its account-switch isolation and retention require separate verification.

## What this PR implements

1. **Flag separation**: `NEXT_PUBLIC_MAPABLE_PUBLIC_ACCESS_ASSISTANT_ENABLED`
   controls the guest discovery widget independently from
   `NEXT_PUBLIC_ASK_MAPABLE_EMBEDDED_ENABLED` for signed-in Ask MapAble.
   Both are default-OFF. There is no change to authentication requirements.
2. **Guest view**: reuses one launcher and panel; defaults to deterministic
   Botkit-inspired guided steps covering the goal, optional area, functional
   access needs and review. Back, Skip, Edit and Restart let visitors correct
   their own choices; no data from the flow is sent to an API or appended to URLs.
   The existing public Provider Finder chat is a separate opt-in mode, and only
   mounts after its processing notice is acknowledged. Private History,
   participant records, bookings and account actions remain excluded.
3. **Route allowlist**: anonymous widget appears only on approved public
   landing/discovery paths; not on account, participant, admin, billing or login.
4. **Contextual starters**: page-context suggestions apply only within the
   opted-in conversation; no diagnosis inference or background tasks.
5. **Independent signed-in path**: original Chat / Actions / History behavior
   remains behind the existing authenticated flag.
6. **Accessibility**: existing dialog + launcher, typed input, keyboard focus
   return, Arrow-key tab focus correction, 44px targets and escape handling.
   Preserve manual non-AI browsing.
7. **Unit tests**: guest separation, one launcher, no private History,
   public routes, default-off flags, dialogue transitions, Back/Skip/Edit,
   local-only links, chat opt-in and synthetic-only vendor evaluation.
8. **Provider comparison**: `lib/ask-mapable/adapters/chatbotkit-sandbox.ts`
   provides an offline benchmark contract; it does not call ChatBotKit.

No ChatKit session or OpenAI API key is introduced. No model is needed in the
browser. The existing provider-finder endpoint may use its configured model;
prompts remain subject to that endpoint's existing policy and provider contracts.
Do not claim zero model processing or zero retention before auditing that endpoint.

## Runtime outline

```text
Public pages                         Signed-in MapAble
        |                                  |
        +------------ AskMapAbleWidget ----+
        |                                  |
 GuestAccessAssistant              Existing authenticated widget
        |                             /api/mapable/ask (unchanged)
        |-- PublicGuidedPath (default, no AI)
        |     \-- approved public route (no user data transferred)
        |
        \-- Explicitly opted-in GuidedSearchDialogue
                    |
             /api/provider-finder/chat (existing Node route)
```

**No route from guest widgets to participant records, bookings, payments, sensitive
screening, application submissions or account history.**

## Proposed Dot-like extension, NOT implemented

- **Phase 2 — Access / Search**: unify consent-aware evidence retrieval using
  MapAble Search, public accessibility observations, source freshness, verification,
  and non-verified claims, backed by Exa/Parallel only where publisher terms and
  purpose-limited privacy permit. Ads must not feed the organic ranking or agent
  context; paid slots remain separately labelled.
- **Phase 3 — opted-in continuity**: AD.iD-authenticated saved goals, explicit
  per-task opt-in, task-specific expiry, revocation, audit, notification preferences
  and event-driven workers. Never import ChatGPT's own Dot memories.
- **Phase 4 — bounded actions**: permission-checked tool gateway for Care,
  Transport and Jobs; explicit confirmation for sharing, contacting, booking,
  spending, submitting or modifying records. NDIS registration, screening,
  privacy and safeguarding approvals must be checked independently.
- **Phase 5 — accessibility modes**: AAC, voice with explicit permissions,
  easy read, transcript/download, keyboard/switch, focus view, screen-reader
  evaluations. No automated diagnosis or ability classification.

## Privacy and release blockers

- Existing guided search uses a browser `sessionStorage` session identifier.
  Review server session retention, logging, rate limiting, consent messaging,
  and cross-user isolation before public launch.
- Review present authenticated `sessionStorage` history for account-switch
  leakage; guest tab must never show that history (this change hides it).
- Run penetration and prompt-injection tests on public finder backend, including
  searches containing private personal or health details, and on user-facing
  "help" responses.
- Existing `AccessiBeWidget` can compete for fixed-position screen area. Manual
  mobile, zoom, keyboard, speech input, switch and screen-reader tests required.
- No claim that `https://mapable.com.au/` is running this branch. No Vercel
  release and no domain configuration are changed.

## Preview configuration

```env
NEXT_PUBLIC_MAPABLE_PUBLIC_ACCESS_ASSISTANT_ENABLED=false
NEXT_PUBLIC_ASK_MAPABLE_EMBEDDED_ENABLED=false
ASK_MAPABLE_EMBEDDED_ENABLED=false
```

Turn on the public flag **in a dedicated reviewed preview only** after tests and
privacy checks. Enabling the public flag does not enable the signed-in assistant
or weaken any API authentication gates.

## Validation commands

```sh
pnpm exec vitest run tests/ask-mapable-widget.test.tsx tests/ask-mapable-public-guest.test.tsx tests/ask-mapable-public-guided-flow.test.tsx tests/ask-mapable-chatbotkit-sandbox.test.ts tests/guided-search-dialogue.test.tsx
pnpm exec tsc --noEmit
pnpm exec next build
```

Additionally run repository CI including accessibility, CodeQL/Semgrep, security,
production-claims and user journeys. Verify preview rendering with Playwright axe,
keyboard tab arrows, Escape/focus restoration, 200% zoom, 320px reflow, reduced
motion, no-account route boundaries and slow-network failures. No approval for
production release is implied by opening this PR.

## Evidence / decision record

| Capability | State | Evidence | Consequence |
| --- | --- | --- | --- |
| Authenticated Ask MapAble | Implemented, flag-gated | existing widget + `/api/mapable/ask` | Reuse, do not duplicate |
| Public no-AI guided steps | In development | `PublicGuidedPath` and pure reducer | Preview accessibility review before enablement |
| Public conversational finder | Existing service, opt-in in guest preview | existing GuidedSearchDialogue + public chat | Requires independent API privacy review |
| Anonymous embedded access companion | In development | this draft PR | Preview test before enablement |
| Full ChatGPT Dots embed | Not supported / not a planned integration | OpenAI product documentation | Build MapAble-owned assistant |
| Saved proactive tasks | Proposed | design only | Needs task permissions, audit, revocation |
| External search/RAG | Proposed | MapAble Search PR #728 | Separate privacy/evidence gates |
| Current production deployment | Not verified | no direct live-site read | No production claims |

## Botkit / ChatBotKit decision record (22 November 2026)

- **Botkit**: MIT-licensed dialogue patterns inspired this deterministic
  TypeScript state machine. Botkit itself is archived; no Express or
  BotBuilder dependency has been introduced.
- **ChatBotKit**: optional future hosted adapter. No vendor SDK, widget,
  network requests, data processing, billing, identity, or advertising
  integration is enabled in this PR.
- **Synthetic evaluation**: at least 20 paired scenarios, zero safety,
  evidence, advertising, or accessibility failures, and >=20% improvement
  in cost or median latency without >10% regression in the other measure.
  A pass yields `further_review`, **never** production authorisation.
- **Consent limitation**: the guest checkbox controls component mounting.
  Existing public Provider Finder server controls and retention require
  independent review. This is not a verified backend consent receipt.
- **Privacy**: the deterministic flow saves nothing, makes no network
  requests and never copies optional area/access text into the destination
  URL. External agent and future ChatBotKit adapters remain unwired.
- **Commercial independence**: no advertiser bids, placements or
  sponsorship fields enter dialogue, provider evidence or ranking.
  Any future ads must remain clearly labelled outside organic results.

### CI evidence and unresolved gates

Previous head `d8847e4` failed CI/Quality from TypeScript errors in
existing ads discovery, marketplace and dashboard-flag tests. Accessibility
and CSP builds stopped at an existing duplicate `/ecosystem` route;
security audit rejected expired dependency-advisory allowlist entries.
The implicated files were present on base `f89cc8f` and outside PR #737's
changed-file list. Do not infer that this PR's new code has passed isolated
tests. Re-run focused tests, typecheck, build, WCAG 2.2 AA and security review
after addressing baseline failures. No production flag may be enabled
from this draft alone.
