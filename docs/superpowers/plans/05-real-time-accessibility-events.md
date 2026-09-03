# Prompt 05 — Real-Time Accessibility Event Network

## Objective

Build a Waze-like event layer for accessibility barriers: lift outages, blocked ramps, construction, temporary stairs, path closures, surface hazards, transit disruptions, and temporary accessible entrances.

Use Temporal **only** where durable multi-step processing materially improves reliability — not for simple database CRUD.

## Non-goals

- Allowing unverified reports to permanently alter underlying infrastructure data
- Replacing the evidence graph (events overlay graph; authoritative updates go through ingestion)
- Real-time claims while offline (Prompt 07)

## Prerequisites

- Prompt 02 merged (graph edge/node references)
- Prompt 04 in progress or merged (route invalidation targets)
- Existing: `AccessTemporaryBarrier`, `app/api/go/barriers/`

## Current claim state

**In development** — `AccessTemporaryBarrier` exists; no full event network

## Event types

Lift outage, blocked curb ramp, construction, temporary stairs, closed accessible entrance, path closure, surface hazard, temporary accessible entrance, transit accessibility disruption.

## Files to create / modify

| Action | Path |
|--------|------|
| Create | `packages/accessibility-events/` — domain types, services |
| Extend | `prisma/schema.prisma` — generalise to `AccessibilityEvent` |
| Create | `lib/accessibility-events/ingestion-service.ts` |
| Create | `lib/accessibility-events/moderation-service.ts` |
| Create | `lib/accessibility-events/corroboration-service.ts` |
| Create | `lib/accessibility-events/route-invalidation.ts` |
| Create | `lib/accessibility-events/notification-service.ts` |
| Extend | `app/api/go/barriers/` — event submission |
| Create | `app/api/accessibility-events/` — moderation, authoritative override |
| Create | `tests/accessibility-events/duplicate-reports.test.ts` |
| Create | `tests/accessibility-events/contradictory-reports.test.ts` |
| Create | `tests/accessibility-events/expired-barriers.test.ts` |
| Create | `tests/accessibility-events/authoritative-reopening.test.ts` |
| Create | `tests/accessibility-events/rapid-repeated-reports.test.ts` |
| Create | `tests/accessibility-events/route-recalculation.test.ts` |
| Create | `tests/accessibility-events/anti-poisoning.test.ts` |

## Data model / API changes

Each event requires: location, feature/edge reference (when available), event type, reported time, expected expiry, source, verification state, confidence.

Capabilities: ingestion, moderation, expiration, corroboration, authoritative override, route invalidation, notifications.

Mitigate malicious reporting and data poisoning (rate limits, corroboration thresholds, reputation from Prompt 06).

## Tests required

- Duplicate reports deduplicated or linked
- Contradictory reports both visible until resolved
- Expired barriers excluded from routing
- Authoritative reopening overrides community reports with audit
- Rapid repeated reports throttled
- Route recalculation triggered on verified event
- Unverified report cannot permanently alter infrastructure truth table

## Docs to write

- Section in `docs/innovation/accessibility-evidence-graph.md` on event overlay

## Commit message (exact)

```
feat: add real-time accessibility event layer
```

## Verification checklist

- [ ] `pnpm type-check`
- [ ] `pnpm test tests/accessibility-events`
- [ ] Events expire automatically
- [ ] Route invalidation fires on verified barrier
- [ ] Temporal used only if multi-step workflow justified (document if used)

## Rollback notes

Disable event submission API; existing barriers remain until expiry. Moderation queue paused.
