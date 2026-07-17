# AURA Wave 4 — Execution Architecture

Wave 4 converts a verified Wave 3 proposal into a participant-approved call to an existing MapAble application service at **L4_APPROVED_SERVICE_WRITE**. The model remains at **L3_PROPOSE**.

## Flow

1. Proposal passes shadow evaluation (`shadow_allowed`)
2. Participant grants **fresh execution approval** (not shadow review)
3. Four-Key rule authorises execution
4. Registry dispatches to canonical service adapter
5. Postconditions verified deterministically
6. Immutable receipt issued; real-world outcome remains `not_observed` until independently confirmed

## Modules

| Module | Path |
|--------|------|
| Approvals | `lib/aura/execution/approval.ts` |
| Four-Key | `lib/aura/execution/four-key.ts` |
| Registry | `lib/aura/execution/registry.ts` |
| Executor | `lib/aura/execution/executor.ts` |
| Outbox | `lib/aura/execution/outbox.ts` |

## Model boundary

No execution tools are registered for the AURA agent. Execution is initiated only through deterministic UI/API routes under `/api/intelligence/aura/proposals/[proposalId]/`.
