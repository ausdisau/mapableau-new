# Provider Finder geolocation

Optional browser geolocation for nearby provider search. Location is kept in React state for the session only — not saved to the database by default.

## Usage

1. Open Provider Finder and run a search.
2. Click **Find my location** (permission is requested only on click).
3. Adjust **Search radius** (5–100 km, default 25 km).
4. Results sort by distance; cards show distance labels.
5. Click **Clear my location** to reset.

## API

`GET /api/providers/search?lat=&lng=&radiusKm=&sort=distance`

Uses Haversine distance (PostGIS-ready later). User coordinates are not returned in provider payloads.

## Map

Leaflet map with `UserLocationLayer` (accuracy circle, no pulse animation). Respects `prefers-reduced-motion` for map panning.
