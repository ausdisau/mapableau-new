# Replay Lab Wave 0 — Repository and Fixture Reconciliation

Wave 0 produces no product runtime. It records what Replay Lab reuses and what it must not duplicate.

## Taylor and Harbour (canonical synthetic world)

| Asset | Path | Replay Lab use |
| --- | --- | --- |
| Harbour Living Access Graph | `lib/access-intelligence-next/graph/harbour-fixture.ts` | Primary synthetic precinct (`harbour-civic-synthetic-v1`) |
| Taylor persona refs | `fixture:taylor`, `fixture:taylor-harbour-v1` | Participant fixture identity in scenarios |
| Door-to-room preflight | `lib/access-intelligence-next/journey/*` | Access adapter projections; unknown lift / corridor preserved |
| Scenario A acceptance | `docs/access-intelligence-next/JOURNEY_PREFLIGHT.md` | Access assertions (`cannot_confirm`, staff entrance excluded) |

**Rule:** Do not invent a second Harbour graph or a second Taylor persona file. Reference AIN fixtures; extend precinct places only via Replay Lab world projections that cite `accessplace:synthetic:harbour_civic` nodes.

## Domain adapter map

| Domain | Canonical path | Replay Lab adapter | Write policy |
| --- | --- | --- | --- |
| Access Intelligence | `lib/access-intelligence-next/` | Access projection adapter | Read fixtures / synthetic projections only |
| Care | `lib/care/` | Care synthetic adapter | Never write `CareShift` / production care tables |
| Transport | `lib/transport*`, mock routing | Transport synthetic adapter | Never write `TransportTrip` |
| Communications | `lib/messages/` patterns | Communications synthetic adapter | No external messages |
| Workforce | `lib/workers/` | Workforce synthetic adapter | Synthetic evidence only |
| Academy | `lib/provider-academy/` | Academy exercise adapter (later) | Training attempts only |
| Continuity | `lib/continuity*`, care backup recovery | Continuity recovery adapter (later) | Synthetic cases only |
| Billing / claims | `lib/billing*`, NDIA dry-run | Billing synthetic adapter (later) | No real invoices/claims |
| Partner sandbox | `lib/partner-sandbox/` | Partner conformance boundary (later) | Block production participant entities |
| Accountability ledger | `lib/ledger/` | Pattern only — separate `mapable.replay.*` ledger | No namespace collision |
| ConvergenceOS golden journeys | Prisma `GoldenJourney` | Catalog inspiration only — not executable Replay store | Do not treat as Replay SoT |
| ConvergenceOS rehearsal / blast | `lib/convergence-os/rehearsal`, `blast/` | Status vocabulary / AI-cannot-approve pattern | Different domain |

## Duplication risks (kill if violated)

1. Second Harbour world graph treated as operational AccessPlace data.
2. Synthetic events written into Care / Transport / Billing Prisma tables.
3. Replay event IDs colliding with production audit or accountability ledger events.
4. GoldenJourney Prisma rows used as the Replay execution engine.
5. Opaque universal “safety score” replacing the multidimensional scorecard.

## Exit criteria (Wave 0)

- [x] Taylor / Harbour reuse paths documented.
- [x] Adapter map and write policies documented.
- [x] No Prisma migration, no production data connection, no implementation claimed as Wave 0 product code.
