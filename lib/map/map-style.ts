/**
 * Shared MapLibre style and viewport defaults.
 *
 * TODO(production-tiles): Do not point heavy production map traffic at the
 * OpenStreetMap Foundation public tile servers (`tile.openstreetmap.org`).
 * Set `NEXT_PUBLIC_MAP_STYLE_URL` to a commercial or self-hosted OSM-compatible
 * style URL (and `NEXT_PUBLIC_MAP_ATTRIBUTION` accordingly). The MapLibre
 * demotiles default below is for development and lightweight preview only.
 *
 * Optional raster templates: `NEXT_PUBLIC_MAP_TILE_URL` or
 * `NEXT_PUBLIC_OSM_TILE_URL` for Leaflet/legacy layers — not for MapLibre style JSON.
 */
export function getMapStyleUrl(): string {
  return (
    process.env.NEXT_PUBLIC_MAP_STYLE_URL ??
    "https://demotiles.maplibre.org/style.json"
  );
}

export function getMapTileUrl(): string | null {
  return (
    process.env.NEXT_PUBLIC_MAP_TILE_URL ??
    process.env.NEXT_PUBLIC_OSM_TILE_URL ??
    null
  );
}

export function getMapAttribution(): string {
  return (
    process.env.NEXT_PUBLIC_MAP_ATTRIBUTION ??
    "© OpenStreetMap contributors"
  );
}

export function getDefaultCenter(): { lat: number; lng: number; zoom: number } {
  return {
    lat: Number(process.env.NEXT_PUBLIC_MAP_DEFAULT_LAT ?? "-33.8688"),
    lng: Number(process.env.NEXT_PUBLIC_MAP_DEFAULT_LNG ?? "151.2093"),
    zoom: Number(process.env.NEXT_PUBLIC_MAP_DEFAULT_ZOOM ?? "10"),
  };
}
