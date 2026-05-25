export const MAPABLE_DEFAULT_MAP_STYLE =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ??
  "https://demotiles.maplibre.org/style.json";

export const MAPABLE_DEFAULT_VIEW = {
  center: [151.2093, -33.8688] as [number, number],
  zoom: 10,
};
