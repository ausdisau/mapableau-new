# NPTM Access Graph CI verification

Status: in development; not a production activation claim.

## Targeted verification

The additive `.github/workflows/nptm-access-graph.yml` workflow exists so the National Public Toilet Map ingestion proof can produce feature-specific regression evidence without weakening or bypassing the repository-wide CI workflow.

On commit `a64f079ae93096e2b4a77006d5b15f6e27393a6a`, NPTM Access Graph workflow run #6 completed successfully:

- Prisma validate: pass
- Prisma generate: pass
- TypeScript `tsc --noEmit`: pass
- NPTM/ontology/test slice ESLint with the repository's documented `ESLINT_CI_LIGHT=1` mode: pass
- NPTM Vitest regression suite: 3 files passed, 13 tests passed

Regression files:

- `tests/access-infrastructure/nptm-normaliser.test.ts` — 7 tests
- `tests/access-infrastructure/nptm-job-metadata.test.ts` — 1 test
- `tests/access-infrastructure/nptm-ingestion-service.test.ts` — 5 tests

## Repository-wide gates

This targeted workflow is additive. `.github/workflows/ci.yml` remains unchanged and still runs the repository-wide lint gate before the full test/build chain. At the same commit, the ordinary CI workflow still failed at repository-wide lint and therefore skipped its later test/build steps. That broader failure is not represented as passing by this document.

The Security workflow also remains an independent required signal; a targeted NPTM pass does not override or waive security findings.

## Release boundary

`MAPABLE_NPTM_INGESTION_ENABLED` remains fail-closed by default. A successful targeted regression run does not enable production ingestion, certify source accuracy, or convert National Public Toilet Map assertions into MapAble accessibility guarantees.
