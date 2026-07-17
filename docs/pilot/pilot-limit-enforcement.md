# Pilot limit enforcement

Caps: max transaction, daily exposure, participant exposure, total exposure (cents).

## Rules

- **Empty allowlists deny** support items / funding routes / integration profiles.
- Reservations are DB-backed and idempotent (`Idempotency-Key` optional).
- Counters come from `loadPilotCounters` — no in-memory authority.
- Fail closed when headroom is insufficient.

Services: `assertPilotTransactionAllowed`, `reservePilotLimit`, `releasePilotReservation`, `commitPilotReservation`.
