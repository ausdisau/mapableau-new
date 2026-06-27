import type {
  PtDeparture,
  PtDisruption,
  PtStop,
  PtTripLeg,
  PtTripOption,
  PtTripPlan,
} from "@/lib/public-transport/types";
import { PT_DISCLAIMERS } from "@/lib/public-transport/types";

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

function readCoord(obj: Record<string, unknown> | null): { lat?: number; lng?: number } {
  const coord = asArray(obj?.coord);
  if (coord.length >= 2) {
    const lng = Number(coord[0]);
    const lat = Number(coord[1]);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng };
  }
  return {};
}

function parseLeg(raw: unknown): PtTripLeg | null {
  const leg = asRecord(raw);
  if (!leg) return null;

  const origin = asRecord(leg.origin);
  const destination = asRecord(leg.destination);
  const transportation = asRecord(leg.transportation);
  const productRaw = leg.product;
  const product = Array.isArray(productRaw)
    ? asRecord(productRaw[0])
    : asRecord(productRaw);

  const mode =
    readString(product, "name") ??
    readString(transportation, "mode") ??
    readString(leg, "mode") ??
    "unknown";

  const iconId = readString(product, "iconId");
  const isOnDemand = iconId === "23";

  const durationSec = Number(leg.duration ?? leg.cumDuration ?? 0);

  return {
    mode,
    origin: readString(origin, "name") ?? readString(origin, "disassembledName") ?? "Origin",
    destination:
      readString(destination, "name") ??
      readString(destination, "disassembledName") ??
      "Destination",
    departureTime: readString(leg, "departureTimePlanned") ?? readString(leg, "departureTime"),
    arrivalTime: readString(leg, "arrivalTimePlanned") ?? readString(leg, "arrivalTime"),
    durationMinutes: durationSec > 0 ? Math.round(durationSec / 60) : undefined,
    routeNumber: readString(transportation, "number"),
    wheelchairAccessible:
      readString(asRecord(leg.properties), "WheelchairAccess") === "true" ||
      readString(asRecord(transportation), "WheelchairAccess") === "true",
    isOnDemand,
  };
}

function parseJourney(raw: unknown): PtTripOption | null {
  const journey = asRecord(raw);
  if (!journey) return null;

  const legs = asArray(journey.legs)
    .map(parseLeg)
    .filter((l): l is PtTripLeg => l != null);

  if (legs.length === 0) return null;

  const durationSec = Number(journey.duration ?? 0);

  return {
    departureTime: readString(journey, "departureTimePlanned") ?? readString(journey, "departureTime"),
    arrivalTime: readString(journey, "arrivalTimePlanned") ?? readString(journey, "arrivalTime"),
    durationMinutes: durationSec > 0 ? Math.round(durationSec / 60) : undefined,
    legs,
    wheelchairAccessible: legs.every((l) => l.wheelchairAccessible !== false),
  };
}

export function parseTfnswTripPlan(raw: unknown): PtTripPlan {
  const root = asRecord(raw);
  const journeys = asArray(root?.journeys ?? root?.trips);

  const options = journeys
    .map(parseJourney)
    .filter((j): j is PtTripOption => j != null);

  return {
    jurisdiction: "NSW",
    options,
    disclaimer: PT_DISCLAIMERS.NSW,
  };
}

export function parseTfnswStops(raw: unknown): PtStop[] {
  const root = asRecord(raw);
  const stopFinder = asRecord(root?.stopFinder);
  const locations = asArray(root?.locations ?? stopFinder?.locations ?? root?.results);
  const stops: PtStop[] = [];

  for (const item of locations) {
    const loc = asRecord(item);
    if (!loc) continue;
    const { lat, lng } = readCoord(loc);
    const id = readString(loc, "id") ?? readString(loc, "name");
    const name = readString(loc, "name") ?? readString(loc, "disassembledName");
    if (!id || !name) continue;
    stops.push({ id, name, lat, lng, modes: asArray(loc.modes).map(String) });
  }

  return stops;
}

export function parseTfnswDepartures(raw: unknown, stopId: string): PtDeparture[] {
  const root = asRecord(raw);
  const events = asArray(root?.stopEvents ?? root?.departures);
  const out: PtDeparture[] = [];

  for (const item of events) {
    const event = asRecord(item);
    if (!event) continue;
    const transportation = asRecord(event.transportation);
    const destination = asRecord(transportation?.destination);
    const location = asRecord(event.location);
    out.push({
      stopId,
      routeNumber: readString(transportation, "number"),
      destination: readString(destination, "name"),
      scheduledTime: readString(event, "departureTimePlanned"),
      estimatedTime: readString(event, "departureTimeEstimated"),
      isRealtime: Boolean(readString(event, "departureTimeEstimated")),
      platform: readString(location, "disassembledName"),
      mode: readString(transportation, "mode"),
    });
  }

  return out;
}

export function parseTfnswDisruptions(raw: unknown): PtDisruption[] {
  const root = asRecord(raw);
  const infos = asRecord(root?.infos);
  const current = asArray(infos?.current ?? root?.messages ?? root?.alerts);
  const out: PtDisruption[] = [];

  for (const item of current) {
    const msg = asRecord(item);
    if (!msg) continue;
    const affected = asRecord(msg.affected);
    out.push({
      id: readString(msg, "id"),
      headline: readString(msg, "subtitle") ?? readString(msg, "headline") ?? "Service alert",
      description: readString(msg, "description"),
      url: readString(msg, "url"),
      affectedLines: asArray(affected?.lines)
        .map((l) => readString(asRecord(l), "name"))
        .filter((n): n is string => Boolean(n)),
      affectedStops: asArray(affected?.stops)
        .map((s) => readString(asRecord(s), "name"))
        .filter((n): n is string => Boolean(n)),
    });
  }

  return out;
}

export function parseTfnswCoordStops(raw: unknown): PtStop[] {
  const root = asRecord(raw);
  const points = asArray(root?.points ?? root?.locations);
  const stops: PtStop[] = [];

  for (const item of points) {
    const point = asRecord(item);
    if (!point) continue;
    const { lat, lng } = readCoord(point);
    const id = readString(point, "id") ?? readString(point, "name");
    const name = readString(point, "name") ?? readString(point, "disassembledName");
    if (!id || !name) continue;
    stops.push({
      id,
      name,
      lat,
      lng,
      distanceMetres: Number(point.distance ?? point.dist) || undefined,
    });
  }

  return stops;
}
