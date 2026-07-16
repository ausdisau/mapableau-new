# Action state machine

Owned by the **Action Gateway** (`lib/access-intelligence/physical/actions/`). Every physical command is an `AiPhysicalAction` (or in-memory demo equivalent) with an append-only event log.

## States

| State | Meaning |
|-------|---------|
| `draft` | Created locally; not yet submitted for policy |
| `proposed` | Submitted; awaiting Safety Kernel (+ Trust Kernel if needed) |
| `pending_approval` | Kernel allowed; human approval required (supervised / tool approval) |
| `approved` | Human approved; ready to queue |
| `queued` | Accepted for dispatch; waiting worker |
| `dispatching` | Adapter invoke in progress |
| `acknowledged` | Device/adapter ack received (when protocol supports it) |
| `succeeded` | Terminal — effect confirmed or mock success |
| `failed` | Terminal — adapter/kernel/business failure |
| `timed_out` | Terminal — no ack within SLA |
| `cancelled` | Terminal — user/ops cancelled before success |

Illegal transitions throw and are audited.

## Sequence (happy path, supervised)

```
draft
  → proposed          (submit)
  → pending_approval  (Safety Kernel allow + approval required)
  → approved          (human Approve)
  → queued
  → dispatching
  → acknowledged      (optional)
  → succeeded
```

Shadow: after kernel allow, Gateway transitions to a dry-run success/failure **without** adapter execute (still logged).

Demo: dispatching calls labelled mock adapters only.

Live (when enabled): may skip `pending_approval` only for action types explicitly cleared for autonomy level 5 — still always through Safety Kernel.

## Failure / cancel paths

- Kernel deny from `proposed` → `failed` (reason = check codes) or return to `draft` for edit (product choice: prefer `failed` with `denial` subtype for audit clarity).
- Cancel from `draft` | `proposed` | `pending_approval` | `approved` | `queued` → `cancelled`.
- Cancel after `dispatching` only if adapter supports abort; else wait for `succeeded` / `failed` / `timed_out`.
- Timeout from `dispatching` | `acknowledged` → `timed_out`.

## Idempotency

- Client supplies `idempotencyKey` (or Gateway derives from placeId + actionType + subjectId + intentHash + time bucket).
- Unique constraint on `(venueOrPlaceId, idempotencyKey)`.
- Replay of the same key returns the **existing** action; does not create a second dispatch.
- Retries from `failed` with a **new** key require explicit ops “retry” that clones to a new `draft`.

## Sequence numbers / events

Each transition appends `AiPhysicalActionEvent`: `{ actionId, from, to, at, actor, reasonCode }`. Consumers (SSE/poll) use monotonic `sequence` for ordering.

## Agent interaction

Agent tools may create `draft` / move to `proposed` only. Approval UI uses the same `needsApproval` pattern as Core write tools. No tool directly sets `dispatching`.

## Related

[SAFETY_KERNEL.md](./SAFETY_KERNEL.md) · [DEVICE_ADAPTERS.md](./DEVICE_ADAPTERS.md) · [SLOS.md](./SLOS.md)
