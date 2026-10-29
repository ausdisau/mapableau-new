# MapAble Care — accessible NDIS provider map (bounded slice)

## Status and boundary

Implementation on a draft branch, not a production-readiness or verification claim.
Route: /care/provider-map. API: GET /api/providers/care-map.
The existing /provider-finder MapLibre view is unchanged.

This feature reads the repository's already-defined NdisProvider ingestion tables.
It does not import workers, perform NDIS screening, geocode personal homes,
book supports, assess provider quality, or provide individual availability.

## Source and provenance

Source: public NDIS Provider Finder directory, ingested by the pre-existing
lib/ingestion/ndis-providers.ts process. Official finder:
https://www.ndis.gov.au/participants/working-providers/finding-providers/provider-finder

The map requires a successful NdisProviderIngestionRun, and only reads rows
whose updatedAt is on/after that run's startedAt. This compensates for the
existing importer not removing deleted outlets. Source last-updated values
are shown only if present in the ingested records; the last successful import
date is labelled separately. Imports over 45 days old receive a warning.
A successful ingestion is not a live registration verification.

No placeholder/demo providers or fabricated worker records are used. No
fallback from a broken NDIA database to marketing/demo listings is allowed.
If the database is unavailable, show an error and the official Finder link.

The API selects a bounded geographic viewport, a maximum of 150 records,
exact NDIS registration group, optional state and name/suburb search. More
matches are flagged rather than presented as a complete census. Pins use
published outlet coordinates, not guaranteed coverage/service areas. Invalid
or non-Australian coordinates are omitted. The participant sees the same
records in the keyboard-accessible list.

## Separate regulatory checks

Provider registration: independent current verification through
https://www.ndiscommission.gov.au/provider-registration/find-registered-provider
Worker status: authorised Worker Screening Database only, described at
https://www.ndiscommission.gov.au/workforce/worker-screening/worker-screening-participants

Individual worker clearance cannot be inferred from an organisation listing.
The map contains no worker clearance statuses, qualifications, quality scores,
provider capacity, access assessment, in-home visit confirmation or suitability
recommendations. In particular, an NDIS registration group is not evidence of
competence for tracheostomy, ventilation, complex bowel care, medications or
dysphagia management. Human assessment remains required.

## Map and accessibility

- OpenStreetMap-derived raster tiles via react-leaflet, already installed.
- OSM attribution visible, tile URL configurable through
  NEXT_PUBLIC_MAPABLE_CARE_TILE_URL for a licensed/self-hosted tile provider.
- Public tile.openstreetmap.org is best-effort only, not a production SLA.
  Do not prefetch/bulk download tiles or build offline downloads against it.
- Equivalent searchable text results, button selection, visible focus, status
  announcements, plain-language no-results/failed-source guidance.
- No automatic precise geolocation or diagnosis disclosure; viewport/search
  filters are sent to MapAble to retrieve directory results.
- Accessibility review still required: keyboard, VoiceOver/NVDA, switch access,
  200% zoom/reflow, reduced motion and user-testing against WCAG 2.2 AA.
- Initial rollout should include manual verification of map keyboard operations
  and the complete list-only path when maps or tile servers fail.

## Release / rollback checklist

1. Run existing database migrations and complete a successful public-source
   ingestion in a staging environment; verify import date and provenance.
2. pnpm exec vitest run tests/care-provider-map-contract.test.ts
3. pnpm type-check and pnpm lint:app-rest / lint:app-api / lint:components.
4. Verify state and group filtering against source rows; verify truncation
   notice, stale-import handling, no-results states and 429/503 recovery.
5. Conduct disability-led keyboard/screen-reader and mobile tests.
6. Confirm CSP img-src allows the chosen tile hostname and tile licensing,
   attribution, referer and cache policy; use scalable tiles for production.
7. Review provider-registry source freshness, imported data terms and
   NDIA/Commission changes before releasing as a verified directory.
8. Keep in draft until independently reviewed; rollback by removing Care
   hub link and disabling /care/provider-map route. No DB migrations added.

## Known limitations

- Only ingested NDIA registered-provider directory records; unregistered
  providers and individual workers are not discoverable through this slice.
- No MapAble-specific provider-declared availability, access verification,
  consent-enabled communication preferences or working hours integrated.
- Map viewport plus limit means results are **not** a nationwide census.
- Existing ingest can fail due to external source access restrictions and
  needs owner-operated refresh and integrity monitoring.
- Process-local IP rate limiting is not a distributed protection system;
  infrastructure hardening is required before high-traffic use.
- Demo fixtures in the test are synthetic and never rendered as providers.
