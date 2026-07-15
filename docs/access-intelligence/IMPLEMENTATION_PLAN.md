# Access Intelligence OS — Living Building Implementation Plan

## Detected architecture (2026-07-15)

| Layer | Detection |
|-------|-----------|
| Framework | Next.js 15.5 App Router (`app/`), React 18 |
| Language | TypeScript strict; Zod schemas in `lib/access-intelligence/schemas.ts` |
| Package manager | pnpm 10.12.1 |
| AI SDK | `ai@^6.0.196`, `@ai-sdk/react@^3`, `@ai-sdk/google@^3` — `ToolLoopAgent`, `Output.object`, `createAgentUIStreamResponse`, `needsApproval` |
| Auth | NextAuth (`requireApiSession`); demo mode via `ACCESS_INTELLIGENCE_DEMO_MODE` |
| DB/ORM | Prisma 6 + Neon/Postgres; Access Intelligence defaults to **in-memory demo repository**; Prisma `ai_*` tables exist, mapper stubbed |
| UI | MapAble Care marketing shell + Tailwind; Leaflet/MapLibre present but Learning/Visit use map-free text routes |
| Tests | Vitest + Testing Library (jsdom); no Playwright in default scripts |
| Existing AI module | Fit, confidence, Dijkstra route, decision-engine package, Learning Lab, Venue Studio, Explore, Pulse |

## Relevant existing modules (reuse, do not fork)

- Engines: `fit-engine.ts`, `confidence-engine.ts`, `route-engine.ts`, `decision-engine/`
- Demo Harbour Civic Centre graph in `demo-data.ts` (`place-harbour-civic`, Room `n-hcc-room`)
- Agent: `agent.ts` + `tools.ts` + `learning/tools.ts`
- APIs under `app/api/access-intelligence/*`
- UI under `components/access-intelligence/*`

## Gap this plan closes (flagship vertical slice)

1. Personal Access Twin (`JourneyContext` + passport)
2. Living Access Twin formal schema + Harbour enrichment (western lift, temporal Entrance B, toilet ops unknown, room door 880 mm, disputed + stale + community evidence)
3. `getAccessStateAt` temporal engine
4. Counterfactual engine + Venue Mutation Studio (Improve)
5. Access Coverage (≥16 synthetic passports)
6. Decision Mirror + Interview L3 flight simulator bridged to **same** fit/route engines
7. Operate mode (incidents, gaps, verification)
8. Rights / consent `ActionPolicyDecision`
9. Building mode landing: Visit / Learn / Operate / Improve
10. Docs suite expansion + tests for vertical slice

## Persistence approach

- Demo: in-memory Living Twin mutations as **preview drafts** (non-destructive)
- Production path: existing Prisma `ai_*` models; document PostGIS later; no second ORM

## Auth / roles

- Visit + Learn: any authenticated (or demo) user
- Operate + Improve: `venue_staff` / `admin` role check; **demo role preview** client control must call APIs that still enforce server checks when `ACCESS_INTELLIGENCE_DEMO_MODE=false`

## Migration strategy

No new Prisma migration required for demo vertical slice. Optional later: journey context, mutation drafts, learning traces tables.

## Phases

1. Enrich Harbour Living Twin + Temporal / Twin schemas  
2. Counterfactual + Coverage + Consent + Decision Mirror  
3. APIs + Visit/Operate/Improve UI + flight-sim bridge  
4. Tests, docs, quality gates, PR update  

## Assumptions

- Fictional venue text always labelled synthetic  
- Chat optional; forms/cards complete Visit without AI keys  
- Western lift element IDs are additive and do not break existing Harbour tests  

## Risks

- Expanding HCC graph may shift route distances — update route assertions  
- Toilet operational “unknown” requires fit-engine recognition of `value: "unknown"`  
- Demo role preview must not weaken production auth  
