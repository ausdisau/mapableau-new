# Assurance migration runbook

Forward-only migration and backfill procedures for Wave 6 assurance schema.

## Migration

`prisma/migrations/20260716245000_ndis_wave6_assurance_readiness/migration.sql` extends `SecurityFramework`, `SecurityControl`, and `SecurityEvidence` — does not replace them.

## Backfill scripts

| Script | Purpose |
|--------|---------|
| `scripts/backfill-assurance-controls.ts` | Seed frameworks and controls |
| `scripts/backfill-security-evidence.ts` | Link legacy `SecurityEvidence` pointers |
| `scripts/backfill-ndia-readiness-bundles.ts` | Backfill bundle `organisationId` from invoices |

All support `--dry-run`.

## Recommended sequence

1. Deploy migration
2. `tsx scripts/backfill-assurance-controls.ts --dry-run` then without dry-run
3. `tsx scripts/backfill-security-evidence.ts --dry-run` then without dry-run
4. `tsx scripts/backfill-ndia-readiness-bundles.ts --dry-run` then without dry-run
5. `pnpm assurance:evaluate` — verify readiness projection
6. Review admin console at `/admin/assurance`

## Rollback

Schema is forward-only. Do not drop assurance tables in production without data export.

**Disclaimers**

- Internal readiness ≠ certification, registration, or NDIA approval.
- Feature flags ≠ readiness. No AI agent may sign or approve production go-live.
- Migration completion does not mean assurance readiness is achieved.
