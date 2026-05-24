import { transportOsmConfig } from "@/lib/transport-osm/config";

import type {
  MatrixRequest,
  MatrixResult,
  RouteRequest,
  RouteResult,
  RoutingProvider,
} from "./types";

export class OpenRouteServiceProvider implements RoutingProvider {
  readonly name = "openrouteservice";

  async route(request: RouteRequest): Promise<RouteResult> {
    const key = transportOsmConfig.orsApiKey;
    if (!key) throw new Error("ORS_NOT_CONFIGURED");

    const profile = request.wheelchairAccessible
      ? "driving-hgv"
      : request.profile ?? "driving-car";

    const coordinates = request.coordinates.map((c) => [c.lng, c.lat]);
    const url = `https://api.openrouteservice.org/v2/directions/${profile}/geojson`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ coordinates }),
    });
    if (!res.ok) {
      throw new Error(`ORS_ROUTE_FAILED:${res.status}`);
    }
    const data = (await res.json()) as {
      features?: Array<{
        properties?: {
          summary?: { distance?: number; duration?: number };
        };
        geometry?: { coordinates?: number[][] };
      }>;
    };
    const feature = data.features?.[0];
    const summary = feature?.properties?.summary;
    const coords = feature?.geometry?.coordinates ?? [];
    const legs = [];
    for (let i = 0; i < request.coordinates.length - 1; i++) {
      const from = request.coordinates[i]!;
      const to = request.coordinates[i + 1]!;
      legs.push({
        from,
        to,
        distanceMeters: Math.round((summary?.distance ?? 0) / Math.max(1, request.coordinates.length - 1)),
        durationSeconds: Math.round((summary?.duration ?? 0) / Math.max(1, request.coordinates.length - 1)),
      });
    }
    return {
      distanceMeters: Math.round(summary?.distance ?? 0),
      durationSeconds: Math.round(summary?.duration ?? 0),
      encodedPolyline: coords.length ? JSON.stringify(coords) : undefined,
      legs,
      provider: this.name,
    };
  }

  async matrix(request: MatrixRequest): Promise<MatrixResult> {
    const key = transportOsmConfig.orsApiKey;
    if (!key) throw new Error("ORS_NOT_CONFIGURED");

    const locations = [
      ...request.origins.map((o) => [o.lng, o.lat]),
      ...request.destinations.map((d) => [d.lng, d.lat]),
    ];
    const sources = request.origins.map((_, i) => i);
    const destinations = request.destinations.map(
      (_, i) => i + request.origins.length
    );

    const res = await fetch(
      "https://api.openrouteservice.org/v2/matrix/driving-car",
      {
        method: "POST",
        headers: {
          Authorization: key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locations,
          sources,
          destinations,
          metrics: ["duration", "distance"],
        }),
      }
    );
    if (!res.ok) throw new Error(`ORS_MATRIX_FAILED:${res.status}`);
    const data = (await res.json()) as {
      durations?: number[][];
      distances?: number[][];
    };
    return {
      durationsSeconds:
        data.durations?.map((row) =>
          row.map((s) => (s == null ? -1 : Math.round(s)))
        ) ?? [],
      distancesMeters: data.distances?.map((row) =>
        row.map((m) => (m == null ? -1 : Math.round(m)))
      ),
      provider: this.name,
    };
  }
}
