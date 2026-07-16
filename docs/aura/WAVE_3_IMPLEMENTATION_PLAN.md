# AURA Wave 3 — Implementation Plan

**Branch:** `cursor/mapable-aura-wave3-6ea8` (from Wave 2)  
**Authority ceiling:** **L3_PROPOSE**  
**External actions:** **zero** (`WRITE_EXECUTION` / `EXTERNAL_DELIVERY` / `PHYSICAL` remain false)

## Foundations found (Wave 1–2)

| Capability | Status |
| --- | --- |
| CareOSMission + AuraMissionExtension | Present |
| Capability leases + Stop + AbortController | Present |
| Proof plans + verifier + counterfactuals | Present |
| Resilience + challenge + offline packs | Present |
| Hash-chained audit witness | Present |
| Prisma `AuraActionProposal` stub (Wave 1) | Present — extend, do not duplicate |

## Direct write paths discovered (excluded from AURA)

| Path | Location | AURA exposure |
| --- | --- | --- |
| `deliverApprovedVenueVerification` | `lib/access-intelligence/adapters/messaging.ts` | Not registered |
| `requestVenueVerification` tool | `lib/access-intelligence/tools.ts` (`needsApproval`) | Not registered |
| `createBarrierReport` / `submitBarrierReport` | AI tools + repo | Not registered |
| `sharePassport` / `shareAccessPassport` | AI tools + repo | Not registered |
| `createTransportTrip` | `lib/transport/transport-trip-service.ts` | Not registered |

AURA Wave 3 exposes **proposal-only** wrappers and pure **preflight** validators.

## Architecture

1. Deterministic `createAuraActionProposal` builds immutable envelopes (hash + idempotency).
2. Independent proposal verifier → `verified_for_shadow` only; `futureExecutionEligible: false`.
3. Participant review = accept/decline for **shadow evaluation only**.
4. Shadow engine runs preflight validators only; `executionAttempted: false`, `externalSideEffects: 0`.
5. Execution guard throws `AURA_EXECUTION_DISABLED` on any write attempt.

## Rollback

Disable `MAPABLE_AURA_PROPOSALS_ENABLED` / review / shadow flags. Never disable Stop while AURA is on. Keep write flags false.
