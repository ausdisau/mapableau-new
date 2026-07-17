# Disruption signals

Signals are the entry point for continuity reasoning. Each signal is validated, freshness-checked, and tenant-scoped before use.

See [`wave-11-signal-taxonomy.md`](./wave-11-signal-taxonomy.md) and [`wave-11-impact-and-detection.md`](./wave-11-impact-and-detection.md).

## Rules

- Unvalidated or stale signals cannot drive destructive action (`isSignalDestructivelyUsable`).
- Adapter-emitted signals do not mutate operational status.
- Civic and external signals retain source attribution and `staleAfter`.

## Disclaimers

- Continuity preserves **participant goals**, not merely bookings.
- Linked-service cancellation does **not** imply automatic cancellation.
- Disruption signals may be wrong or stale.
- External feed data remains **source attributed**.
- Participant criticality is **not** a ranking score.
- Essential support is **not** inferred from diagnosis.
- Recovery options are **participant controlled**.
- Standing instructions are **limited and revocable**.
- Clinical, legal, and emergency decisions remain **human**.
- Estimated costs are **not** available budget.
- Generated options are **not** confirmed capacity.
- Booking acceptance is **not** recovery completion.
- Participants can **reject all** options.
- No response is **not** consent.
- AURA **cannot** call emergency services automatically.
- No AI may create standing authority, choose a replacement worker without permission, approve additional spending, submit claims, change funding routes, determine legal emergencies, or close serious incidents.
