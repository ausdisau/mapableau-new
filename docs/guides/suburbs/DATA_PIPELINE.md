# Data Pipeline for National Suburb Access Guides

## Purpose

Create a repeatable pipeline that can generate suburb guide records for every Australian suburb/locality and gradually enrich them with practical accessibility information.

## Recommended pipeline

```txt
Official suburb/locality boundaries
+ OpenStreetMap places and paths
+ public toilet datasets
+ transport feeds
+ council open data
+ MapAble reviews and venue records
-> suburb access guide records
-> verification status
-> public pages
```

## Import steps

1. Place official suburb/locality GeoJSON in `data/raw/sal.geojson`.
2. Run `tools/import-abs-sal-geojson.ts`.
3. Review `data/generated/suburb-access-guides.generated.json`.
4. Import into database or generate a TypeScript data file.
5. Keep generated guides as `draft` or `data-enriched` until they have useful access content.

## Enrichment fields

- transport notes
- toilet notes
- parking and drop-off notes
- step-free route notes
- sensory notes
- venue highlights
- health and support anchors
- local risks
- nearby guides
- data source references

## Data ethics

Do not expose private household-level information. Use suburb-level summaries and public-place data. Treat disability, access needs, support preferences and location history as sensitive personal information.
