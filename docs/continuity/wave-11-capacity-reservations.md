# Wave 11 — Capacity reservations

A reservation HOLDS capacity without committing. Lifecycle: `held` → `confirmed` / `released` / `expired` / `cancelled`.

- `windowEnd <= windowStart` is refused.
- Only an approved recovery plan step can move a reservation to `confirmed`.
- `expireOverdueReservations` runs periodically to expire windows in the past.

Reservations do NOT bypass the underlying booking system. They are a coordination construct — the actual booking still needs to be created (through an approved plan) before the window starts.
