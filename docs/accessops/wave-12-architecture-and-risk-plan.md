# Wave 12 — AccessOps architecture and risk plan

**Branch:** `feat/wave-12-accessops-civic-digital-twin`  
**Governing principle:** Accessibility information must become operational infrastructure — with provenance, ownership, freshness, reliability and repair — grounded in the lived experience and choices of disabled people.

## Authoritative refactor decision

**Do not create a parallel accessibility map.** AccessOps overlays and governs existing systems:

| Existing surface                                            | AccessOps role                                               |
| ----------------------------------------------------------- | ------------------------------------------------------------ |
| `AccessPlace` / `AccessFeature` / `AccessOperationalStatus` | Canonical place inventory; projected into `AccessAsset`      |
| `AccessFloorPlan` + `structuredData` route graph            | Indoor twin geometry; versioned via `AccessGraphPublication` |
| `IndoorAccessibilityIncident`                               | Migrates toward `AccessOpsIncident` with provenance          |
| `AccessiblePlace` (legacy)                                  | Backfill source only; not new writes                         |
| `lib/access-map/**`, `lib/indoor-accessibility/**`          | Reused engines behind AccessOps policy                       |
| Partner API v1                                              | Retained; v2 is scope-controlled AccessOps surface           |

## Phase 1 audit findings (summary)

### Models found

1. **Place:** `AccessiblePlace` (legacy), `AccessPlace` (canonical Wave access), `AccessibilityVenueClaim`
2. **Venue:** claims + partner venue DTOs; no first-class civic owner registry
3. **Floor plan:** `AccessFloorPlan` with JSON `structuredData` / `publishedData`
4. **Route graph:** Zod schema in `lib/floor-plan/route-graph.ts` — not first-class DB edges
5. **Feature enums:** `AccessFeatureType`, indoor feature types, place feature flags
6. **Operational status:** `AccessOperationalStatus` + demo lift hard-codes
7. **Community:** access reports / corrections / reviews (partial)
8. **Accreditation:** multiple accreditation paths; incomplete UI
9. **External sources:** OSM attribution paths; no SensorThings/WoT/GTFS AccessOps registry
10. **Imports:** map import / moderation workflows exist; provenance incomplete
11. **Status subscriptions:** feature-flagged; **no durable model**
12. **Webhooks:** partner scaffolding; **delivery worker absent**
13. **Feature flags:** indoor, status subscriptions, 3D/AR disabled, open-data gated
14. **Env gates:** substantial operational enablement via flags
    15–33. Provenance/freshness/owner gaps, restricted geometry risk, partner DTO leakage, demo routes, incomplete authoring

### Critical risks remediated in Wave 12

| Risk                                              | Remediation                                                                 |
| ------------------------------------------------- | --------------------------------------------------------------------------- |
| Partner floor-plans return raw `features`         | Strip to public DTO; require `restricted-assets` scope for internals        |
| Indoor incidents GET unauthenticated + raw Prisma | Auth + entitlement + AccessOps DTO                                          |
| Authoring GET unauthenticated                     | Require session + floor-plan manage permission                              |
| Dual place stores                                 | Backfill into `AccessAsset`; no new `AccessiblePlace` writes from AccessOps |
| Demo incidents/routes as live                     | `test_only` lifecycle; audit scripts                                        |
| Status without freshness                          | `AccessStatusEvent` + projection marks `stale`                              |
| Missing owner fabricated                          | Explicit `unknown` entity; never invent ownership                           |
| Sensor → status mutation                          | Sensors emit candidates only; no actuation                                  |
| Universal accessibility score                     | Forbidden; feature-level only                                               |
| Participant journeys in open data / webhooks      | Privacy filter + payload minimisation                                       |

### Known limitations (honest)

- Authoring studio keyboard path completed; advanced canvas remains progressive
- Outdoor routing provider **not** connected (shell + provenance model only)
- Status subscriptions remain flag-gated until worker + model proven
- Open data / SensorThings / WoT / GTFS feeds **disabled by default**
- 3D/AR remain disabled
- Accreditation UI remains partial; boundary enforced in domain
- No physical actuation path exists or will be added

## Non-goals

- Legal certification claims
- Automatic regulatory notices or penalties
- Inferring disability from route preferences
- Ranking participants by infrastructure priority
- Commercial sponsorship affecting route safety
- Remote operation of lifts, doors, gates, or kerbs
