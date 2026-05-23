import type {
  MatrixRequest,
  MatrixResult,
  RouteRequest,
  RouteResult,
  RoutingProvider,
} from "./types";

function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export class PlaceholderRoutingProvider implements RoutingProvider {
  readonly name = "placeholder";

  async route(request: RouteRequest): Promise<RouteResult> {
    const legs = [];
    let totalM = 0;
    for (let i = 0; i < request.coordinates.length - 1; i++) {
      const from = request.coordinates[i]!;
      const to = request.coordinates[i + 1]!;
      const distanceMeters = Math.round(haversineMeters(from, to) * 1.35);
      const durationSeconds = Math.round((distanceMeters / 1000 / 40) * 3600);
      totalM += distanceMeters;
      legs.push({ from, to, distanceMeters, durationSeconds });
    }
    const durationSeconds = legs.reduce((s, l) => s + l.durationSeconds, 0);
    return {
      distanceMeters: totalM,
      durationSeconds,
      legs,
      provider: this.name,
    };
  }

  async matrix(request: MatrixRequest): Promise<MatrixResult> {
    const durationsSeconds = request.origins.map((o) =>
      request.destinations.map((d) =>
        Math.round((haversineMeters(o, d) / 1000 / 40) * 3600)
      )
    );
    return { durationsSeconds, provider: this.name };
  }
}
