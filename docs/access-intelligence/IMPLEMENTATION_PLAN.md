# Access Intelligence OS — Living Building Implementation Plan

## Detected architecture (2026-07-16)

| Layer | Detection |
|-------|-----------|
| Framework | Next.js 15.5 App Router (`app/`), React 18 |
| Language | TypeScript strict; Zod in `lib/access-intelligence/schemas.ts` + `living/schemas.ts` |
| Package manager | pnpm 10.12.1 |
| AI SDK | `ai@^6.0.196`, `@ai-sdk/react@^3`, `@ai-sdk/google@^3` — `ToolLoopAgent`, `Output.object`, `createAgentUIStreamResponse`, `needsApproval` |
| Auth | NextAuth (`requireApiSession` / `getCurrentUser`); demo via `ACCESS_INTELLIGENCE_DEMO_MODE` (default on) |
| Roles | `mapable_admin` / `provider_admin` or `AiVenueStaffAssignment`; demo `x-access-role` only when demo mode on ([`auth/venue-access.ts`](../../lib/access-intelligence/auth/venue-access.ts)) |
| DB/ORM | Prisma 6 + Neon/Postgres |
| Persistence | **Places/passports:** demo in-memory repository (default). **Living ops:** `getLivingPersistence()` → memory, or Prisma when `ACCESS_INTELLIGENCE_USE_PRISMA=true` **and** demo off (`AiLivingTwinMeta`, drafts, traces, staff, snapshots) |
| Live feeds | Typed adapters (`live/`); HTTP BMS if `ACCESS_INTELLIGENCE_BMS_URL`; else demo BMS → last-known snapshot/evidence |
| UI | MapAble Care shell + Tailwind; map-free text routes for Visit/Learn |
| Tests | Vitest + Testing Library; no Playwright in default scripts |

## Relevant modules (reuse — do not fork)

| Area | Path |
|------|------|
| Engines | `fit-engine.ts`, `confidence-engine.ts`, `route-engine.ts`, `decision-engine/` |
| Living twin | `living/harbour-civic.ts`, `temporal.ts`, `counterfactual.ts`, `coverage.ts`, `flight-simulator.ts`, `decision-mirror.ts` |
| Persistence / auth / live | `persistence/`, `auth/venue-access.ts`, `live/` |
| Agent | `agent.ts`, `tools.ts` |
| Pages | `app/access-intelligence/buildings|operate|improve|learn|passport|…` |
| APIs | `app/api/access-intelligence/*` |

## Vertical slice status

**Engines done:** Harbour Living Twin, Personal Access Twin, temporal state, fit/route/confidence, counterfactual, coverage (≥16 synthetic), Decision Mirror, Interview L3 flight-sim API, Operate/Improve APIs, venue gates, living persistence, live adapters.

**Gap-fill phase (this pass):** product UX for acceptance walkthrough A–D.

1. Visit UI — passport/journey selectors, rejected Entrance A, evidence, verification approval  
2. Learn UI — Interview L3 flight-sim + Decision Mirror (flagship; Lab remains catalogue)  
3. Operate/Improve — role preview query param; FORBIDDEN recovery without demo bypass in production  
4. Expand stub engine docs to reference real modules  
5. Tests + quality gates + PR update  

## Persistence approach

- Demo: in-memory Living Twin incident/draft/trace store; mutation **previews** never mutate baseline  
- Production living: Prisma migration `20260715200000_access_intelligence_living_persistence`  
- Main place/passport CRUD remains demo repository until a full Prisma mapper lands (documented limitation)

## Auth / roles

- Visit + Learn: authenticated or demo user  
- Operate + Improve: server `requireVenueOperateAccess` — production ignores `x-access-role`  
- Demo role preview: client convenience only when `ACCESS_INTELLIGENCE_DEMO_MODE` is on  

## Migration strategy

Living tables already migrated. Optional later: journey context rows, durable consent Map → Prisma, full `prisma-repository` for places/passports.

## Assumptions

- Harbour Civic Centre always labelled fictional; no legal compliance claims  
- Chat optional; forms complete Visit without AI keys  
- Same deterministic engines power Visit and Learn (no toy Learn branch)

## Risks

- Expanding Visit payload may require UI test updates  
- Demo role headers must never weaken production auth  
- Full-repo `eslint .` may OOM; use scoped lint on changed paths  

## Out of scope (limitations)

Live BMS unless URL configured; venue messaging; GTFS; assessor field apps; full Prisma place mapper; Playwright E2E.
