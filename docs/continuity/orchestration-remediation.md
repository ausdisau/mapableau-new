# Orchestration remediation

Pre-Wave 11 orchestrator integrity fixes (H remediation). Care cancellation no longer auto-cancels linked transport.

See [`wave-11-architecture-and-risk-plan.md`](./wave-11-architecture-and-risk-plan.md) § H remediation.

## Fixes

| Finding | Remediation |
|---------|-------------|
| Auto-cancel transport on care cancel | Emit signal + open case; no transport mutation |
| `Date.now()` idempotency keys | Deterministic keys; upsert orchestration row |
| Placeholder address / missing date | `OrchestrationInvalidError` — refuse creation |
| Unscoped reschedule queue | Require `organisationId`; paginate |

Audit: `pnpm exec tsx scripts/audit-direct-cancellation-propagation.ts --dry-run`

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
