# W-ACS-0 — Autonomous Care & Support Stage 0 evidence pack

**Status:** proposed in this PR; recorded in [`FEATURE_FREEZE.md`](../../remediation/FEATURE_FREEZE.md)  
**Does not lift the global freeze.**  
**Does not expand W-AA-1 paths.**  
**Does not authorise Stage 1.**

| Field        | Value                                                                                                                                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Waiver ID    | W-ACS-0                                                                                                                                                                                                                               |
| Domain       | ACS Stage 0 evidence pack (Decision 5 of the 6 November 2026 paper)                                                                                                                                                                   |
| Paths        | Union with #670: `docs/ai-platform/acs/**`, `docs/ai-platform/AUTONOMY_ENVELOPE_STAGE_0.md`, `lib/autonomy/envelope.ts`, `lib/consent/exact-purpose-check.ts`, `tests/autonomy/stage0-evidence.test.ts`, freeze table, `tests/acs/**` |
| Schema       | **None**                                                                                                                                                                                                                              |
| Flags        | Unchanged; all agentic flags remain default **false** (`=== "true"` to enable)                                                                                                                                                        |
| Public claim | `internal_alpha` / not claimable                                                                                                                                                                                                      |
| Stack        | Single docs/tests PR; do not deepen Geoscape W-GEO-1 or MapAble #22                                                                                                                                                                   |
| Still frozen | `lib/ai/platform/retrieval/care-support/**`; Temporal enable; second consent SoT; physical/clinical; production claims; stacks deeper than three unmerged product PRs                                                                 |
| Non-goals    | Merging MapAble PR #22; implementing PEP; durable Stop runtime; Prisma migrations; live data                                                                                                                                          |
| Rollback     | Revert the docs/tests commit                                                                                                                                                                                                          |

## Relationship to W-AA-1

W-AA-1 remains the Autonomy Assurance **product** waiver (ARC sidecar, AURA harness, Trust Fabric, Decision Passport projection). W-ACS-0 is documentation and synthetic tests for the ACS discussion paper. Stage 1 consent/Stop code requires a **separate** waiver (**W-ACS-1**, previewed in [STAGE_0_DIFF_PROPOSAL.md](./STAGE_0_DIFF_PROPOSAL.md), **not issued here**).

## Permanent prohibitions (inherited)

No autonomous funding/claim/invoice/payment approval; support reduction; worker or driver assignment; worker suspension; clinical or behaviour-support decisions; restrictive-practice approval; safeguarding findings; consent alteration by a model; capacity or mental-state inference from voice, face, gait, AAC delay, silence, or behavioural telemetry.
