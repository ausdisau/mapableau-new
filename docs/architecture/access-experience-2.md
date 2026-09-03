# ADR — MapAble Access Experience 2.0

## STATUS

**Accepted** for bounded Phase 1 implementation, feature-flagged (`MAPABLE_ACCESS_EXPERIENCE_V2_ENABLED`, default off).

## CONTEXT

Accessibility information is represented across:

- Accessibility Map (`app/accessibility-map/`)
- AccessFit (`lib/access/fit/`)
- GAIS (`lib/gais/`)
- Participant accessibility preferences (`AccessibilityProfile`, `AccessPassport`)
- Indoor floor-plan capability (`lib/access/indoor/`, `lib/access/floor-plan/`)
- Future Navigate / MapAble Go systems (`lib/access/navigate/`, `lib/go/`)

Today, map and list views can diverge in result sets; AccessFit uses score/label summaries; place detail hard-codes demo needs; and contribution paths are fragmented.

## DECISION

1. **GAIS** owns accessibility evidence and provenance (read/query in Phase 0).
2. **My Access** owns participant-selected functional access requirements (`AccessPassport` when enabled; else `AccessibilityProfile` projection; journey overrides are session-scoped).
3. **Access Experience** evaluates evidence against selected requirements and presents options (MAP, LIST, future AROUND_ME, AUDIO).
4. **Navigate** owns journey lifecycle and routing execution.
5. MAP, LIST, Around Me, and Audio are presentation modes over the same exploration state.
6. The visual map must never be required to complete a core discovery journey.
7. **UNKNOWN** is a valid first-class state — never coerced to accessible/inaccessible.
8. No universal "accessible / inaccessible" verdict may replace detailed evidence.
9. User requirements must not be inferred from diagnosis (`containsDiagnosis: false` on passport).
10. Accessibility compatibility does not authorize mobility hardware, service bookings, payments, or other consequential actions.

## REFERENCE PRINCIPLES (design inspiration only)

| Reference | Principle borrowed |
|-----------|-------------------|
| AccessMap / OpenSidewalks | Personalised constraints |
| Soundscape Community | Non-visual spatial orientation (Phase 2) |
| Project Sidewalk | Evidence granularity; observations ≠ immediate truth |
| Wheelmap | Fast community contribution |
| OsmAnd | Offline/haptic resilience (Phase 3) |
| GAIS | MapAble accessibility intelligence |
| My Access | Person-specific requirements |
| Navigate / MapAble Go | Journey orchestration |

These projects do not endorse MapAble. No source code or proprietary assets are reused without licence analysis.

## PHASE 1 DELIVERY

- `AccessExplorationState` contract
- Functional `AccessRequirementProfile`
- AccessFit V2 (`MEETS` / `DOES_NOT_MATCH` / `UNKNOWN`)
- MAP / LIST parity from shared filtered result IDs
- Evidence-state presentation (GAIS terminology)
- Quick accessibility observation contribution
- Accessible place detail improvements
- Feature flags, tests, documentation

## CONVERGENCE BOUNDARY (Access mapping)

Canonical discovery for Access Experience V2 is **`/access`** behind
`MAPABLE_ACCESS_EXPERIENCE_V2_ENABLED` / `NEXT_PUBLIC_MAPABLE_ACCESS_EXPERIENCE_V2_ENABLED`
(default off, fail-closed):

| Concern | Owner |
|---------|-------|
| Place identity | `AccessPlace` |
| Public exploration projection | `AccessExplorationDto` (no Prisma / diagnosis / PII) |
| Evidence read | GAIS adapters (best-effort enrichment) |
| Compatibility | AccessFit V2 (`MEETS` \| `DOES_NOT_MATCH` \| `UNKNOWN`) |
| Mapping engine | MapLibre on `/access` |
| Journey execution | MapAble Go sandbox handoff (mobility prefs only) |

**Deprecated for production exploration:** `DemoAccessPlace` and Leaflet
`/accessibility-map` demo adapters. Keep `/accessibility-map` until parity is
proven; do not expand demo models. Temporary bridges live in
`lib/access/experience/demo-access-place-adapter.ts` and
`buildExplorationResultIdsFromDemoPlaces`.

## PHASE 2 — Around Me + Accessibility Compass (design only)

Target queries: "What's around me?", "What's ahead?", "Nearest step-free entrance", "Describe this crossing", "Where is the lift?"

Contract: `AccessibilityCompassItem` with bearing, distance, feature type, access relevance, evidence state. Outputs must support text, screen reader, and eventual spatial audio — no voice-only requirement.

## PHASE 3 — Offline Access Packs (design only)

Example: Northern Beaches Access Pack — base map, saved places, access evidence, crossings, kerb ramps, surfaces, saved journeys.

Rules: show downloaded-at time; show evidence freshness; never present cache as live. Haptic vocabulary minimal and user-configurable.

## PHASE 4 — Cross-domain continuity (design only)

Home → building exit → footpath → crossing → transport → destination entrance → floor → room using MapAble Home, GAIS, Navigate, Transport, indoor floor plans, MapAble Go. No cross-domain orchestration in Phase 1.

## MAPABLE GO SAFETY BOUNDARY

Access Experience supplies **advisory** navigation information only. Nothing in this domain may steer a wheelchair, change drive mode, write to CAN/bus, alter firmware, or override OEM safety.

## MANUAL ACCESSIBILITY TEST CHECKLIST

Document environment limitations rather than claiming unavailable hardware was tested.

| Check | NVDA + Chrome/Firefox | VoiceOver + Safari | Keyboard only | 400% zoom | Reduced motion | Low bandwidth / list-only |
|-------|----------------------|-------------------|---------------|-----------|----------------|---------------------------|
| Search places | | | | | | |
| Apply requirements | | | | | | |
| Switch MAP ↔ LIST without losing selection | | | | | | |
| Complete journey in LIST only (no map) | | | | | | |
| Inspect AccessFit V2 (MEETS / UNKNOWN / DOES NOT MATCH) | | | | | | |
| View evidence provenance | | | | | | |
| Open place detail | | | | | | |
| Submit quick observation | | | | | | |
| Windows High Contrast / forced colors | | | | | | |
| AAC text-entry compatibility | | | | | | |
| TalkBack (future Android) | N/A in web Phase 1 | | | | | |
