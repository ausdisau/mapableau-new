# Pilot migration runbook

1. Ensure Prisma migrations for ControlledPilot models are applied.
2. Set `PILOT_ENFORCEMENT_ENABLED=false` until org allowlists and caps are configured.
3. Create draft pilots via `POST /api/admin/pilots` with **positive caps**; leave limited live false.
4. Invite participants and authorise workers; record pilot consent before enrol.
5. Progress stages only with human decisions; attach Wave 6 assessment **string refs** before limited live.
6. Never treat `NdiaPilotApprovalRecord` or NDIA pilot flags as ControlledPilot authority.
7. Closure: drain reservations, exit participants, run closure report scripts under `scripts/pilot-*.ts`.

**Reminder:** pilot approval ≠ production approval; empty allowlists deny; no real NDIA submission.
