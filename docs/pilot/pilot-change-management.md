# Pilot change management

Change requests: submit → approve → apply (record deployment) → optional rollback.

## Rules

- `pilot:change:approve` required to approve/apply/rollback.
- Apply is gated by pilot status/stage (`canApplyPilotChange`).
- **Change approval ≠ production approval.**
