export function providersToGeoJSON(
  providers: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
  }>
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: providers.map((p) => ({
      type: "Feature",
      id: p.id,
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
      properties: { name: p.name },
    })),
  };
}
