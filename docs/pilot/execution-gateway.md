# Execution gateway

`pilotExecutionGateway` wraps side-effecting payment/billing actions with ControlledPilot policy.

## Rules

- Consults pilot status, stage, allowlists, enrolment, limits, and limited-live gates.
- **Does not** consult `NdiaPilotApprovalRecord`.
- **Does not** submit to NDIA.
- Enabled for claim/payment paths only when `PILOT_ENFORCEMENT_ENABLED=true`.
