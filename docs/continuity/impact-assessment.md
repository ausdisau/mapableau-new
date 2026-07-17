# Impact assessment

Read-only computation of downstream nodes and goal exposure given a disruption signal and the continuity graph.

See [`wave-11-impact-and-detection.md`](./wave-11-impact-and-detection.md) and [`wave-11-continuity-graph.md`](./wave-11-continuity-graph.md).

## Output

- Affected nodes, essential-support exposure, and estimated (not budget) cost hints.
- Impact feeds `buildRecoveryOptions`; it does not execute changes.

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
