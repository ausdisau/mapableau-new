# Control frameworks

MapAble tracks internal readiness against concise control catalogues seeded from `lib/assurance/frameworks/catalogue-seed.ts`.

## Framework kinds

| Kind | Purpose |
|------|---------|
| `internal_baseline` | MapAble security baseline (IAM, change, logging) |
| `privacy_act_app` | Australian Privacy Principles alignment |
| `ndis_quality_safeguards` | NDIS Practice Standards and Quality Indicators (readiness tracking) |
| `ndia_digital_platform` | NDIS digital platform registration controls |
| `soc2_readiness` / `iso27001_readiness` | External assurance prep — not certification |

Catalogues use source labels and control codes only. They are **not** copyrighted standards text.

## Operations

- Seed: `pnpm assurance:backfill-frameworks` (or `tsx scripts/backfill-assurance-controls.ts --dry-run`)
- Admin: `/admin/assurance/frameworks`
- Detail: `/admin/assurance/frameworks/[frameworkId]`

See also [frameworks.md](./frameworks.md) for seed file location.

**Disclaimers**

- Internal readiness ≠ certification, registration, or NDIA approval.
- Feature flags ≠ readiness. No AI agent may sign or approve production go-live.
- Seeding a framework does not confer certification.
