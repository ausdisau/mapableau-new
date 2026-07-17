# Wave 11 — Operations runbook

## Enabling the wave

1. Apply the `20260716290000_wave11_life_events_service_recovery` migration.
2. Enable feature flags — Wave 11 respects existing `y3NationalTrustConfig` and does not add any global "on/off" switch. The AURA `service-recovery` specialist activates only when its manifest row is marked `active`.
3. Register civic feeds under `CivicFeedRegistration` with `status="proposed"`, then approve and activate one at a time.

## Common on-call scenarios

- **Care cancellation "cascaded" and cancelled transport**: it did not — Wave 11 blocks that path. Confirm the orchestration event has `metadata.transportMutated=false` and a `continuityCaseId` reference.
- **Stale signal driving action**: confirm `staleAfter` and `status`. Signals with `status="stale"` are refused by `isSignalDestructivelyUsable`.
- **Unscoped queue exposure**: `listPendingRescheduleRequests` and `listContinuityCases` throw when `organisationId` is missing.
- **Emergency dispatch attempted**: `EmergencyBoundaryError` is thrown; escalate the case with reason `emergency_boundary_reached`.
- **Standing instruction expired**: `evaluateStandingInstruction` returns `authorised=false` with `reason="expired"`.

## Reports

Run `pnpm continuity:evaluate` to produce a roll-up report of continuity health for a tenant (dry-run capable).
