# Continuity cases

`ContinuityCase` is a projection optionally linked to the existing `Case` model. Cases are tenant- and participant-scoped.

See [`wave-11-case-lifecycle.md`](./wave-11-case-lifecycle.md).

## Lifecycle

```
open → triage → planning → awaiting_approval → in_recovery → monitoring → resolved → closed
```

- Opened before any linked service status is mutated.
- Only approved recovery-plan steps perform executable mutations.
- AURA cannot close safeguarding or serious incidents.

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
