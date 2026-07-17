# AURA Wave 2 — Implementation Plan

**Branch:** `cursor/mapable-aura-wave2-6ea8` (from Wave 1)  
**Authority ceiling:** L2_RECOMMEND  
**Writes:** none (proposals remain Wave 3+)

## Wave 1 foundations (verified)

| Capability                           | Status                                 |
| ------------------------------------ | -------------------------------------- |
| CareOSMission + AuraMissionExtension | Present                                |
| In-memory mission store + leases     | Present                                |
| Proof-carrying plan + verifier       | Present                                |
| Taylor@Harbour planner               | Present                                |
| Stop endpoint + lease revocation     | Present → hardened in Wave 2           |
| Witness events                       | Present → hash-chained in Wave 2       |
| Challenge advisory                   | Present → bounded structured in Wave 2 |
| `/ask` Accessibility Mission UI      | Present                                |
| No Prisma in agent tools             | Present                                |
| Authority L2_RECOMMEND               | Present                                |

## Wave 2 completion state

| Deliverable                           | Status                                     |
| ------------------------------------- | ------------------------------------------ |
| Deterministic counterfactual adapter  | Done (`lib/aura/counterfactual`)           |
| Resilience assessment                 | Done                                       |
| Bounded plan challenge (1 cycle/plan) | Done                                       |
| Plan version list on mission          | Done                                       |
| Stop + AbortController + receipt      | Done                                       |
| Hash-chained audit replay             | Done                                       |
| Offline Visit Pack + HTML             | Done                                       |
| APIs + UI extensions                  | Done                                       |
| Prisma additive migration             | Done (`20260716210000_mapable_aura_wave2`) |
| Tests                                 | `tests/aura/wave2-*.test.ts`               |

## Security / a11y / rollback

See COUNTERFACTUAL_ENGINE, STOP_PROTOCOL, AUDIT_REPLAY, OFFLINE_VISIT_PACKS, THREAT_MODEL, ACCESSIBILITY, ROLLBACK.

## Not in Wave 2

- Action proposals / external writes (Wave 3+)
- Durable participant memory
- Physical actuation
- Full PWA service-worker offline
- CSI kernel writers (not on this lineage)
