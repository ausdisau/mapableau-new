# GAIS import plan (read-only)

## Rules

- Preserve `source_record_id`  
- Default classification: **Unknown** + `unverified_legacy_import`  
- Reject aggregate rows  
- Icon-only and layer hints (toilet/stairs/parking/accessible) never promote to Green  
- Chunk large GeoJSON (8MB+) with idempotent upserts keyed by `source_record_id`  

## ADL `accessScore` risk

`mapable-adl-dataset.ts` layer heuristics can imply soft scores (e.g. stairs). Those must **not** be read as verified Access Signals RAG. Production `/accessibility-map` is unchanged in this PR; follow-on work should document or gate misleading scores.

## Open gate

Drive-hosted GAIS package was inaccessible here — reconcile before bulk import.
