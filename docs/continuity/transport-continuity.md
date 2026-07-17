# Transport continuity

Transport booking cancellations emit `transport_booking_cancelled` signals. Care shifts are **not** auto-cancelled when transport is disrupted.

See [`wave-11-domain-adapters.md`](./wave-11-domain-adapters.md) and [`orchestration-remediation.md`](./orchestration-remediation.md).

## Rules

- Goal-preserving options may include retaining transport when care is cancelled (participant may still need the ride).
- Placeholder addresses and missing dates block orchestration link creation.

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
