# Prompt 04 — Personalised Accessible Routing

## Objective

Implement profile-based accessible routing that respects hard constraints and soft preferences, returns multiple route strategies with per-segment evidence explanations, and never invents accessibility information to complete a route.

Salvage false-safe routing patterns from [archive/03-navigate.md](./archive/03-navigate.md). Integrate passport/disclosure concepts from [archive/02-personal-access-passport.md](./archive/02-personal-access-passport.md) via `FunctionalMobilityProfile` — not a standalone passport PR.

## Non-goals

- `wheelchairMode` boolean as sole accessibility input
- Guaranteed accessible arrival claims
- Replacing vehicle transport routing (`lib/transport/routing/`)
- Indoor routing at national scale

## Prerequisites

- Prompt 02 merged (evidence graph with provenance)
- Prompt 03 merged (evidence resolution)
- Portfolio epic: [E03 MapAble Navigate](../../innovation/epics/03-navigate.md)

## Current claim state

**In development** — anchors: `lib/access/navigate/route-planner.ts`, `lib/access/navigate/scoring.ts`, `lib/go/route-service.ts` (sandbox graph), `AccessPassport`

## Routing model

### Hard constraints (exclusion)

No stairs, minimum clear width, required lift access, maximum physical barrier.

### Soft preferences (cost penalties)

Gentler grades, fewer crossings, less walking, lower sensory load, fewer transfers, simpler route, higher evidence confidence.

### Cost function (conceptual)

Travel time + accessibility penalties + known disruption risk + **evidence uncertainty**. Stale or unsupported evidence incurs uncertainty cost — not treated as verified.

### Route strategies

| Strategy | Intent |
|----------|--------|
| **Reliable** | Highest evidence confidence; may be longer |
| **Easier** | Lower physical demand |
| **Simpler** | Fewer decision points / transfers |
| **Fastest** | Shortest time; must surface low-confidence segments |

Each route includes evidence explanation, e.g.:
- Reliable — 14 min — Verified step-free; lift status confirmed recently
- Fastest — 12 min — One curb transition has low-confidence evidence

## Files to create / modify

| Action | Path |
|--------|------|
| Create | `lib/navigate/functional-mobility-profile.ts` |
| Extend | `lib/access/navigate/route-planner.ts`, `scoring.ts`, `types.ts` |
| Extend | `lib/go/route-service.ts` — wire to evidence graph (flag-gated off sandbox) |
| Extend | `lib/go/profile-service.ts` — map profile → constraints |
| Extend | `app/api/go/routes/plan/route.ts` |
| Extend | `app/api/go/routes/[id]/evidence/route.ts` |
| Extend | `app/api/access/navigate/route/route.ts` |
| Create | `tests/navigate/hard-constraint-exclusion.test.ts` |
| Create | `tests/navigate/slope-preference.test.ts` |
| Create | `tests/navigate/temporary-lift-outage.test.ts` |
| Create | `tests/navigate/stale-evidence-penalty.test.ts` |
| Create | `tests/navigate/conflicting-observations.test.ts` |
| Create | `tests/navigate/no-accessible-route.test.ts` |
| Create | `tests/navigate/never-invent-evidence.test.ts` |
| Update | `docs/mapable-go/ROUTING_MODEL.md` |

## Data model / API changes

- `FunctionalMobilityProfile` — functional requirements without medical diagnosis
- `RouteSegment` includes: `provenance`, `freshnessState`, `uncertaintyCost`, `blockingUncertainty`
- Response returns multiple strategies with explanations
- Integrate with existing MapLibre/map stack — extend, do not replace

## Tests required

- Stairs as hard exclusion
- Slope preference affects soft ranking
- Temporary lift outage changes route
- Stale evidence penalty applied
- Conflicting observations surfaced in explanation
- No accessible route → honest failure (not invented path)
- Never invent accessibility information

## Docs to write

- Update `docs/mapable-go/ROUTING_MODEL.md`
- Update `docs/innovation/epics/03-navigate.md` when gates pass

## Commit message (exact)

```
feat: add evidence-aware personalised routing
```

## Verification checklist

- [ ] `pnpm type-check`
- [ ] `pnpm test tests/navigate`
- [ ] Multiple route strategies returned with explanations
- [ ] Unknown segment never labelled verified accessible
- [ ] Sandbox graph can be disabled via flag for live graph testing

## Rollback notes

Disable navigate routing flags; fall back to advisory preflight-only mode. Sandbox graph remains default until live graph verified.
