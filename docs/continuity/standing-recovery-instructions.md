# Standing recovery instructions

Narrow, revocable pre-authorisations that may accelerate option selection. They are re-evaluated at execution time and cannot authorise prohibited actions.

See [`wave-11-standing-instructions.md`](./wave-11-standing-instructions.md).

## Limits

- Cannot authorise emergency dispatch, financial approvals, claim submission, or worker substitution without explicit permission.
- Expired or revoked instructions return `authorised=false`.
- No AI may create or extend standing authority.

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
