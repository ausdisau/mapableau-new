import type { MapBbox } from "@/lib/map/map-layer-query";
import { pointInBbox } from "@/lib/map/map-layer-query";

const emptyCollection = (): GeoJSON.FeatureCollection => ({
  type: "FeatureCollection",
  features: [],
});

export function providersToGeoJSON(
  providers: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
  }>,
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: providers.map((p) => ({
      type: "Feature",
      id: p.id,
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
      properties: { id: p.id, name: p.name },
    })),
  };
}

export function userLocationToGeoJSON(center: {
  lat: number;
  lng: number;
}): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        id: "user-location",
        geometry: {
          type: "Point",
          coordinates: [center.lng, center.lat],
        },
        properties: { label: "Search area" },
      },
    ],
  };
}

export function tripsToLineGeoJSON(
  trips: Array<{
    id: string;
    pickupLat: number;
    pickupLng: number;
    dropoffLat: number;
    dropoffLng: number;
    status?: string;
  }>,
  bbox?: MapBbox,
): GeoJSON.FeatureCollection<GeoJSON.LineString> {
  const features: GeoJSON.Feature<GeoJSON.LineString>[] = [];

  for (const trip of trips) {
    const midLat = (trip.pickupLat + trip.dropoffLat) / 2;
    const midLng = (trip.pickupLng + trip.dropoffLng) / 2;
    if (bbox && !pointInBbox(midLat, midLng, bbox)) continue;

    features.push({
      type: "Feature",
      id: trip.id,
      geometry: {
        type: "LineString",
        coordinates: [
          [trip.pickupLng, trip.pickupLat],
          [trip.dropoffLng, trip.dropoffLat],
        ],
      },
      properties: {
        tripId: trip.id,
        status: trip.status ?? "unknown",
      },
    });
  }

  return { type: "FeatureCollection", features };
}

export function tripsToStopsGeoJSON(
  trips: Array<{
    id: string;
    pickupLat: number;
    pickupLng: number;
    dropoffLat: number;
    dropoffLng: number;
    pickupSuburb?: string | null;
    dropoffSuburb?: string | null;
  }>,
  bbox?: MapBbox,
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  const features: GeoJSON.Feature<GeoJSON.Point>[] = [];

  for (const trip of trips) {
    const stops: Array<{
      stopType: "pickup" | "dropoff";
      lat: number;
      lng: number;
      suburb?: string | null;
    }> = [
      {
        stopType: "pickup",
        lat: trip.pickupLat,
        lng: trip.pickupLng,
        suburb: trip.pickupSuburb,
      },
      {
        stopType: "dropoff",
        lat: trip.dropoffLat,
        lng: trip.dropoffLng,
        suburb: trip.dropoffSuburb,
      },
    ];

    for (const stop of stops) {
      if (bbox && !pointInBbox(stop.lat, stop.lng, bbox)) continue;
      features.push({
        type: "Feature",
        id: `${trip.id}-${stop.stopType}`,
        geometry: {
          type: "Point",
          coordinates: [stop.lng, stop.lat],
        },
        properties: {
          tripId: trip.id,
          stopType: stop.stopType,
          suburb: stop.suburb ?? undefined,
        },
      });
    }
  }

  return { type: "FeatureCollection", features };
}

export function filterFeatureCollectionToBbox(
  collection: GeoJSON.FeatureCollection,
  bbox: MapBbox,
): GeoJSON.FeatureCollection {
  const features = collection.features.filter((feature) => {
    if (feature.geometry.type !== "Point") return true;
    const [lng, lat] = feature.geometry.coordinates;
    return pointInBbox(lat, lng, bbox);
  });
  return { type: "FeatureCollection", features };
}

export function mergeFeatureCollections(
  ...collections: Array<GeoJSON.FeatureCollection | null | undefined>
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  for (const c of collections) {
    if (c?.features?.length) features.push(...c.features);
  }
  return { type: "FeatureCollection", features };
}

export { emptyCollection };
