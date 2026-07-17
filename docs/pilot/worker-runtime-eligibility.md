# Worker runtime eligibility

Workers must be authorised per pilot via `PilotWorkerAuthorisation` and the runtime worker gate.

## Rules

- Credential checks are required (empty checks deny).
- APIs never expose restricted worker findings or full credential payloads.
- Suspend revokes `active`; recheck re-runs `authoriseWorkerForPilot`.
- Authorisation is stage-gated (`authorise_worker`).
