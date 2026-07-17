# Wave 12 migration runbook

## Migration

`prisma/migrations/20260716300000_wave12_accessops_civic_digital_twin`

Forward-only. Additive enums/tables only.

## Sequence

1. `pnpm prisma migrate deploy` (or `migrate dev` in development)
2. Dry-run backfills: `scripts/backfill-access-*.ts --dry-run`
3. Dry-run audits: `pnpm accessops:audit-*`
4. Review artifacts under `artifacts/`
5. Enable feature flags only after human approval — never auto-activate feeds, outdoor routing, open data, or partner writes

## Rollback

- Application rollback: disable AccessOps flags; keep tables (forward-only).
- Do not DROP Wave 12 tables in production without a dedicated approved plan.
- Do not fabricate owners/uptime during backfill to “fix” audits.

## Non-activation defaults

All `ACCESSOPS_*` flags default to false in `.env.example`.
