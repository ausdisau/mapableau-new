# Governed Action Kernel (Prompt 02)

Canonical location: `lib/ai/platform/actions/`

Participant-approved action proposals for Mission Runtime prepare_* actions.
Execution is deterministic, approval-bound, and kill-switch gated.

## Flags (fail-closed)

- `MAPABLE_ACTION_KERNEL_ENABLED`
- Per-action: `MAPABLE_ACTION_*_ENABLED`
- `MAPABLE_ACTION_KERNEL_KILL_SWITCH`

## Recovery integration (Prompt 03)

Adaptive Recovery prepares Action Kernel proposals via
`prepareKernelProposalFromMission` when a participant selects a recovery alternative.
Recovery never bypasses the kernel for operational writes.

See [ADAPTIVE_RECOVERY_ENGINE.md](./ADAPTIVE_RECOVERY_ENGINE.md).

## Connector Gateway integration (Prompt 09)

External writes that leave MapAble must pass:

`Action Kernel approved envelope → Connector Gateway → scoped adapter`

Agents must not call external APIs directly or receive connector credentials.
See [CONNECTOR_GATEWAY.md](./CONNECTOR_GATEWAY.md).

