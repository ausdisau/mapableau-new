# Continuity reliability

Integrity baselines, test plans, and audit scripts for Wave 11 continuity.

See [`wave-11-integrity-baseline.md`](./wave-11-integrity-baseline.md), [`wave-11-test-plan.md`](./wave-11-test-plan.md), and [`wave-11-migration-runbook.md`](./wave-11-migration-runbook.md).

## Audit scripts

Pack-root wrappers delegate to `scripts/continuity/*`:

- `scripts/audit-orchestration-links.ts`
- `scripts/audit-direct-cancellation-propagation.ts`
- `scripts/audit-unscoped-recovery-queries.ts`
- `scripts/audit-recovery-idempotency.ts`
- `scripts/audit-placeholder-operational-data.ts`
- `scripts/audit-continuity-consent.ts`
- `scripts/audit-provider-failure-paths.ts`

Run with `--dry-run` for source-level reports without DB writes.

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
