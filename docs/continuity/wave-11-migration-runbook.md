# Wave 11 migration runbook

Enablement, migration, backfill, and verification for Wave 11 continuity.

See [`wave-11-operations-runbook.md`](./wave-11-operations-runbook.md).

## Steps

1. Apply migration `20260716290000_wave11_life_events_service_recovery`.
2. Activate AURA `service-recovery` specialist manifest when ready.
3. Register civic feeds as `proposed`; activate one at a time after validation.
4. Run backfills (dry-run first):
   - `pnpm exec tsx scripts/backfill-continuity-nodes.ts --dry-run`
   - `pnpm exec tsx scripts/backfill-continuity-dependencies.ts --dry-run`
5. Migrate legacy reschedule requests:
   - `pnpm exec tsx scripts/migrate-reschedule-requests.ts --dry-run`
6. Run audit suite with `--dry-run`; review artifacts under `artifacts/continuity/`.
7. Run `pnpm continuity:evaluate` for tenant health roll-up.

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
