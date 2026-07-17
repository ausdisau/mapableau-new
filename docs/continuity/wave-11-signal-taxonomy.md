# Wave 11 — Continuity signal taxonomy

Signals are LEAN inputs to the continuity graph. Every signal has:

- A `dedupeKey` (deterministic, provided by caller).
- `observedAt` (when the source system observed it).
- `staleAfter` (freshness deadline, defaulted per kind).
- `confidence` (`low` / `medium` / `high` / `verified`).
- `status` (`received` -> `validated` -> `correlated` -> `resolved`, or `stale` / `rejected`).

Signals with `status="stale"` cannot drive destructive action. Signals below `medium` confidence cannot drive destructive action.

See `lib/continuity/signals/signal-service.ts::isSignalDestructivelyUsable` for the guardrail.
