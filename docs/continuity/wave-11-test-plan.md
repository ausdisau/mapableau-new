# Wave 11 — Test plan

Automated tests live under `tests/continuity/` and `tests/life-events/`, at least 50 cases in total.

Must-cover:

- No auto-cancel of transport on care cancel.
- Deterministic idempotency (no `Date.now()` in continuity keys).
- Placeholder address blocks executable booking.
- `listPendingRescheduleRequests` respects coordinator and fails closed if unscoped.
- Standing instruction expiry, prohibitions, high_irreversible refusal.
- Essential support not inferred from diagnosis.
- Graph cycle detection; cancel does not auto-propagate.
- Simulation performs no writes.
- Emergency boundary (`assertNotEmergencyAction`, narrative claim scan).
- AURA `service-recovery` cannot call emergency services (manifest + specialist config).
- Stale signal cannot destroy.
- Financial recovery cannot approve invoice / submit claim.
- Civic feed disabled by default.
- Life event auto-from-history prohibited.

Dry-run scripts under `scripts/continuity/` complement the vitest cases and are safe to run without a database.
