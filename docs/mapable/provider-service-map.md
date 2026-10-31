# Provider service map: evidence and implementation

Status: **Implemented in draft PR; not independently production-verified**.

Route: `/provider-finder/service-map`.

## Architecture

- Reuses `GET /api/providers/map` and the repository's geocoded NDIS provider ingestion.
- Reuses `components/map/MapLibreMap.tsx`, existing basemap configuration and accessible map/list parity.
- Offers name, service, and location filters and an export of GeoJSON Point features for Leaflet / OSM-compatible tooling.
- Avoids adding another mapping library or an unreviewed external reverse-geocoding API.
- Loads at most 500 coordinates per query. The API may have more matches than displayed.

## Evidence and regulated distinctions

The import is a **directory snapshot**, not a live NDIS Commission status check. Never infer registration status, enforcement history, clearance, worker credentials, high-intensity capability, availability or suitability from a plotted location. GeoJSON contains only provider identity, general locality and coordinates supplied by the existing API; do not export participant addresses or worker identifiers.

Provider registration checks must use the NDIS Commission's official Provider Register; individual worker status is accessible only through the authorised NDIS Worker Screening Database / issuing state Worker Screening Unit. Public compliance and enforcement results are a separate dimension, not a screening proxy.

## Acceptance / verification

1. Open the route with no data and with an imported provider dataset.
2. Search NSW / postcode / service / name and verify API query parameters and filter accuracy.
3. Confirm list keyboard access, screen reader status announcements, zoom and focus controls, contrast, and WCAG 2.2 AA behaviour.
4. Check GeoJSON coordinate order as [longitude, latitude] and import into Leaflet.
5. Confirm empty, error and more-than-500-result states are disclosed.
6. Confirm no worker screening or current registration claims appear in cards, map pins or downloads.
7. Gate release on current ingestion provenance / timestamp visibility, CI, privacy review and human approval.

No live provider registration or NWSD lookup has been implemented by this change.
