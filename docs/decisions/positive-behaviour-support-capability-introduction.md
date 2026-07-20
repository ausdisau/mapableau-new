# Decision — Positive Behaviour Support capability introduction

**Status:** approved narrow freeze exception (implementation authorised 2026-07-20)  
**Capability key:** `pbs.positive_behaviour_support`  
**Maturity:** `controlled_pilot`  
**publicClaimAllowed:** `false`  
**externalModelEnabled:** `false`  
**Branch:** `cursor/mapable-positive-behaviour-support-foundation-0813`  
**Base SHA at branch creation:** `b18fbf63d62624cb31d933198c5ec8eb9ea4593d`

## Approval record

Implementation proceeded after explicit instruction to implement the Capability Introduction Decision Pack plan. The following narrow exception terms apply:

> Narrow feature-freeze exception for MapAble Positive Behaviour Support foundation work on branch `cursor/mapable-positive-behaviour-support-foundation-0813` (Decision Pack named `cursor/mapable-positive-behaviour-support-foundation`; cloud branch suffix `-0813` applied), limited to a controlled-pilot, practitioner-led assessment/drafting/implementation/monitoring workspace under `lib/positive-behaviour-support/` with one additive `Pbs*` migration, server-only default-false `MAPABLE_PBS_*` flags, `publicClaimAllowed: false`, `externalModelEnabled: false`, no production flag enablement, no merge to main without separate review, and no public production claims. MapAble is not substituting clinical PBS or claiming Commission approval/registration; AI remains `DRAFT_ONLY` / proposal-only and must never finalise plans or approve restrictive practices.

This prompt / Decision Pack approval does **not** lift the remediation feature freeze globally.

## Strategy alignment

[`docs/strategy/BUILD_PARTNER_DEFER.md`](../strategy/BUILD_PARTNER_DEFER.md) partners behaviour support and states MapAble does not substitute PBS. This capability is practitioner-led tooling for suitably verified practitioners — not MapAble clinical substitution, registration as a specialist behaviour support provider, or Commission lodgement.

## Domain owner / SoT

| Item | Value |
|------|--------|
| Owner package | `lib/positive-behaviour-support/**` |
| Aggregates | `Pbs*` Prisma models |
| Consent | Reuse `ConsentRecord` (+ `behaviour_support_share` scope) |
| Audit | Reuse `AuditEvent` via PBS sanitiser |
| Authority | Reuse `ParticipantAuthorityGrant` |
| Access receipts | Reuse `ParticipantAccessReceipt` / break-glass |
| Sources | Reuse `ProgrammeSourceRecord` |

## Positioning

“MapAble Positive Behaviour Support is a controlled-pilot, practitioner-led assessment, drafting, implementation and monitoring workspace.”
