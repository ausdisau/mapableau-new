# Prompt 03 — Provenance, Licensing & Data Ingestion

## Objective

Build the MapAble geospatial ingestion and provenance pipeline. Every imported dataset or observation must carry license, attribution, and permitted-use metadata. Preserve conflicting evidence instead of silently overwriting.

## Non-goals

- Tightly coupling domain model to one mapping provider
- Assuming all sources permit the same downstream use
- Production-scale imagery/CV ingestion (Prompt 09)

## Prerequisites

- Prompt 02 merged (evidence graph targets)
- Existing: `lib/access/infrastructure/provenance.ts`, `lib/integrations/adapters/openstreetmap-adapter.ts`

## Current claim state

**Proposed** — provenance vocabulary exists; no ingestion package or idempotent pipeline

## Data sources (architect for)

OpenStreetMap, Overture, GTFS, GTFS-Realtime, municipal GIS, venue data, community observations, future imagery/CV-derived claims.

## Required metadata per import

`source`, `sourceType`, `license`, `attribution`, `acquisitionTimestamp`, `geographicPrecision`, `permittedDownstreamUses`, `validationState`, `ingestionVersion`.

## Files to create / modify

| Action | Path |
|--------|------|
| Create | `packages/data-ingestion/` — adapter interfaces |
| Create | `packages/provenance/` — license, attribution, resolution |
| Create | `packages/data-ingestion/adapters/osm-adapter.ts` |
| Create | `packages/data-ingestion/adapters/gtfs-adapter.ts` |
| Create | `packages/data-ingestion/adapters/overture-adapter.ts` (scaffold) |
| Create | `lib/access/ingestion/reconciliation-service.ts` |
| Create | `lib/access/ingestion/evidence-resolution-service.ts` |
| Extend | `prisma/schema.prisma` — `DataSource`, `IngestionRun` |
| Create | `tests/ingestion/duplicate-ingestion.test.ts` |
| Create | `tests/ingestion/license-metadata.test.ts` |
| Create | `tests/ingestion/conflicting-sources.test.ts` |
| Create | `tests/ingestion/authoritative-update.test.ts` |
| Create | `tests/ingestion/stale-community-report.test.ts` |
| Create | `tests/ingestion/source-deprecation.test.ts` |
| Create | `docs/innovation/data-provenance.md` |
| Create | `docs/innovation/data-source-register.md` |

## Evidence resolution service outputs

- `currentBestEvidence`
- `supportingObservations`
- `conflictingObservations`
- `confidence`
- `freshness`
- `explanation`

## Data model / API changes

- Adapter pattern behind stable interfaces
- Ingestion idempotency: repeated same source/version must not duplicate records
- Source reconciliation preserves conflicts
- Internal APIs only in this PR (public API in Prompt 11)

## Tests required

- Duplicate ingestion rejected or upserted idempotently
- License metadata preserved through pipeline
- Conflicting sources both retained
- Authoritative update changes `currentBestEvidence` with audit
- Stale community reports decay correctly
- Source deletion/deprecation does not orphan graph without `UNKNOWN` fallback

## Docs to write

- `docs/innovation/data-provenance.md`
- `docs/innovation/data-source-register.md`

## Commit message (exact)

```
feat: add provenance-aware accessibility ingestion
```

## Verification checklist

- [ ] `pnpm type-check`
- [ ] `pnpm test tests/ingestion`
- [ ] OSM adapter ingests sample fixture idempotently
- [ ] License metadata visible on resolved evidence
- [ ] No silent overwrite of community evidence by authoritative source without audit

## Rollback notes

Disable ingestion cron/workers via feature flag. Ingested records remain for audit; mark sources `deprecated`.
