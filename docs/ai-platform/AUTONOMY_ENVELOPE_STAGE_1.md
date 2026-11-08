# Stage 1 — Autonomous Care & Support deterministic trust

**Status:** Stage 1 trust gates, flag-off by default. Not a production architecture, NDIS rating, TGA classification or deployment authorisation.  
**Paper:** Australian Disability Ltd / MapAble — Autonomous Care & Support, 6 November 2026, v1.0  
**Depends on:** [AUTONOMY_ENVELOPE_STAGE_0.md](./AUTONOMY_ENVELOPE_STAGE_0.md)  
**Waiver:** **W-ACS-1** (does not lift the global freeze).

This artefact records what Stage 1 actually wired: exact-purpose consent on consequential ACS paths, a durable tenant-scoped Stop, and a synthetic PEP. Flags default **false**. No live agents, ParticipantRAG, Temporal, payments, or physical/clinical care.

## Envelope (unchanged)

| Level | First-release stance |
| --- | --- |
| L0 / L1 | Permitted as explain/draft |
| L2 | Type ceiling only — no standing-instruction workflow (Stage 3) |
| L3–L4 | Not authorised |
| L5 | Never a deployment target |

## What is live vs flagged

| Mechanism | Default | Behaviour |
| --- | --- | --- |
| `checkConsent()` | Unchanged | Subject, scope, recipient, active, expiry. **No** purpose/fields. |
| `requireConsent()` | Unchanged | Calls `checkConsent` only |
| `requireExactConsent()` | Flag `MAPABLE_ACS_EXACT_CONSENT_ENABLED` | Purpose required always. When flag on: `checkExactPurposeConsent`. When off: log skip, then legacy `checkConsent` |
| Programme execution | Process-local Stop always | Durable Stop + exact consent only when their flags are true |
| Durable Stop | Flag `MAPABLE_ACS_DURABLE_STOP_ENABLED` | Prisma `AutonomyStop` + `AuditEvent` `autonomy.stop`. Companion device Stop is **not** the server Stop |
| PEP `evaluateAutonomyPep` | Exact-consent flag | Fail-closed retrieval stub; rejects client-supplied role; tenant mismatch denied **before** loader |

## Remaining gaps (honest)

- Dual authority writers (`lib/authority` vs `lib/programmes/authority`). No third grant table was added. Programme evaluator remains the purpose/field matcher for programme actions.
- `AgentRun` can still persist `completed` without a human checkpoint. Stage 1 does not use AgentRun for live tools.
- Programme Stop on the companion remains device-local encrypted storage.
- No L2 standing-instruction workflow.
- Feature freeze remains active; W-ACS-1 does not authorise Stage 2.

## Tests

Run: `pnpm exec vitest run tests/autonomy/stage0-evidence.test.ts tests/autonomy/stage1-trust.test.ts tests/programmes/current-main-compatibility.test.ts`

| ID | Case |
| --- | --- |
| S1-01 | Exact purpose mismatch denied |
| S1-02 | Field not in `dataScope` denied (empty `dataScope` fail-closed) |
| S1-03 | Revoke then retry denied |
| S1-04 | Durable Stop survives process-local reset when flag on |
| S1-05 | Cross-tenant deny before retrieval stub |
| S1-06 | Missing purpose does not silently grant ACS-flagged paths |
| S1-07 | Trust Fabric AI authority still false; no live fetch |

## Out of scope

Text/AAC persona, public search UX, breakfast continuity scenario, standing instructions, Temporal replay, RAG on private data, device control, payments, capacity inference, merging `lib/aura/`.

## Human go/no-go

Stage 1 is done when synthetic negatives pass with flags default **false**, and reviewers accept W-ACS-1. It does **not** authorise Stage 2 or any unattended workflow.
