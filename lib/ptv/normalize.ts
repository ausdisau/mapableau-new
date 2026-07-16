import type { PtDeparture, PtDisruption, PtStop } from "@/lib/public-transport/types";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function readString(obj: Record<string, unknown> | null, key: string): string | undefined {
  const v = obj?.[key];
  return typeof v === "string" ? v : undefined;
}

export function parsePtvSearchStops(raw: unknown): PtStop[] {
  const root = asRecord(raw);
  const results = asArray(root?.results ?? root?.stops);
  const stops: PtStop[] = [];

  for (const item of results) {
    const stop = asRecord(item);
    if (!stop) continue;
    const lat = Number(stop.latitude ?? stop.lat);
    const lng = Number(stop.longitude ?? stop.lng);
    const id = String(stop.stop_id ?? stop.id ?? "");
    const name = readString(stop, "stop_name") ?? readString(stop, "name") ?? "";
    if (!id || !name) continue;
    stops.push({
      id,
      name,
      lat: Number.isNaN(lat) ? undefined : lat,
      lng: Number.isNaN(lng) ? undefined : lng,
      modes: stop.route_type != null ? [String(stop.route_type)] : undefined,
    });
  }

  return stops;
}

export function parsePtvNearbyStops(raw: unknown): PtStop[] {
  const root = asRecord(raw);
  const items = asArray(root?.stops ?? root?.results);
  const stops: PtStop[] = [];

  for (const item of items) {
    const stop = asRecord(item);
    if (!stop) continue;
    const lat = Number(stop.stop_latitude ?? stop.latitude);
    const lng = Number(stop.stop_longitude ?? stop.longitude);
    const id = String(stop.stop_id ?? "");
    const name = readString(stop, "stop_name") ?? "";
    if (!id || !name) continue;

    const wheelchair = asRecord(stop.stop_accessibility);
    const wheelchairInfo = asRecord(wheelchair?.wheelchair);

    stops.push({
      id,
      name,
      lat: Number.isNaN(lat) ? undefined : lat,
      lng: Number.isNaN(lng) ? undefined : lng,
      distanceMetres: Number(stop.stop_distance ?? stop.distance) || undefined,
      wheelchairAccessible:
        readString(wheelchairInfo, "accessibility_status") === "accessible" ||
        wheelchairInfo?.accessibility_status === true,
    });
  }

  return stops;
}

export function parsePtvDepartures(raw: unknown, stopId: string): PtDeparture[] {
  const root = asRecord(raw);
  const stopNode = asRecord(root?.stop);
  const departures = asArray(root?.departures ?? stopNode?.departures);
  const out: PtDeparture[] = [];

  for (const item of departures) {
    const dep = asRecord(item);
    if (!dep) continue;
    const route = asRecord(dep.route);
    out.push({
      stopId,
      routeNumber: readString(route, "route_number") ?? readString(route, "route_name"),
      routeName: readString(route, "route_name"),
      destination: readString(dep, "run_destination"),
      scheduledTime: readString(dep, "scheduled_departure_utc"),
      estimatedTime: readString(dep, "estimated_departure_utc"),
      isRealtime: Boolean(readString(dep, "estimated_departure_utc")),
      isCancelled: dep.status === "Cancelled" || dep.status === "cancelled",
      platform: readString(dep, "platform_number"),
      mode: readString(route, "route_type_name"),
    });
  }

  return out;
}

export function parsePtvDisruptions(raw: unknown): PtDisruption[] {
  const root = asRecord(raw);
  const disruptions = asRecord(root?.disruptions);
  if (!disruptions) return [];

  const all: PtDisruption[] = [];

  for (const value of Object.values(disruptions)) {
    for (const item of asArray(value)) {
      const d = asRecord(item);
      if (!d) continue;
      all.push({
        id: d.disruption_id != null ? String(d.disruption_id) : undefined,
        headline: readString(d, "title") ?? readString(d, "headline") ?? "Disruption",
        description: readString(d, "description"),
        status: readString(d, "disruption_status"),
        publishedAt: readString(d, "published_date"),
      });
    }
  }

  return all;
}
