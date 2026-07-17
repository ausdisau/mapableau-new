# Emergency boundary

Wave 11 blocks emergency-service automation. AURA cannot call 000, dispatch ambulance, police, or fire services.

See [`wave-11-emergency-boundary.md`](./wave-11-emergency-boundary.md) and [`wave-11-not-emergency.md`](./wave-11-not-emergency.md).

## Rules

- Plans containing emergency dispatch steps throw `EmergencyBoundaryError`.
- Escalate with reason `emergency_boundary_reached` for human safety officers.
- No AI may determine legal emergencies or close serious incidents.

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
