# Waves 2–14 — Delivery notes (foundation slices)

This branch lands **first vertical slices** for each wave as synthetic, flag-gated contracts. Full product depth follows in subsequent PRs.

| Wave | Slice delivered | Key paths |
|------|-----------------|-----------|
| 2 | Handoff card + AURA adapter interface (no external send) | `lib/communications-os/handoff-card.ts`, `aura-adapter.ts` |
| 3 | Worker readiness + credential expiry projection | `lib/workforce-os/`, `GET /api/workforce/readiness` |
| 4 | Academy catalogue, SSO architecture, completion exchange | `lib/academy/`, `/api/academy/*` |
| 5 | Competency evidence bridge (completion ≠ competency) | `exchangeLearningCompletion`, workforce checks |
| 6 | Equipment Passport shadow mode | `lib/at-lifecycle-os/`, `/api/equipment/passport` |
| 7 | Shadow repair request workflow | `createShadowRepairRequest` |
| 8 | Companion architecture + offline Visit Pack contracts | `lib/companion/`, `/api/companion/visit-pack` |
| 9 | Architecture reserved (Access Lens flag off; no live vision) | `MAPABLE_COMPANION_ACCESS_LENS_ENABLED=false` |
| 10 | Outcome Contract + immutable Receipt | `lib/outcomes-ledger/`, `/api/outcomes/*` |
| 11 | Daily Attention Queue projection | `lib/provider-ops/`, `/api/provider-ops/attention` |
| 12 | Synthetic capacity need/candidate exchange | `lib/regional-capacity/`, `/api/regional-capacity/exchange` |
| 13 | Developer catalogue + sandbox Taylor workflow | `lib/developer-platform/`, `/api/developer/catalogue` |
| 14 | Golden Taylor scenario test + pilot design doc | `tests/connected-capability/golden-taylor-scenario.test.ts` |

## Non-claims

- Not production ready
- No NDIS registration / certification claim
- No automatic assignment, prescription, or outcome determination
- No real participant data ingested
