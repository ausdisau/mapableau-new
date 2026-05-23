import { schedulingConfig } from "@/lib/config/scheduling";

export type OrsLocationPayload = {
  coordinates: [number, number][];
  metadata?: { stopCount: number; profile: string };
};

const PII_FIELD_PATTERN =
  /address|home|disability|ndis|participantNotes|supportNeeds|narrative|email|phone|name/i;

export function roundCoordinate(value: number): number {
  const factor = 10 ** schedulingConfig.coordinatePrecision;
  return Math.round(value * factor) / factor;
}

export function toOrsCoordinate(lat: number, lng: number): [number, number] {
  return [roundCoordinate(lng), roundCoordinate(lat)];
}

export function buildOrsRoutingPayload(
  points: { lat: number; lng: number }[],
  profile = "driving-car"
): OrsLocationPayload {
  return {
    coordinates: points.map((p) => toOrsCoordinate(p.lat, p.lng)),
    metadata: { stopCount: points.length, profile },
  };
}

export function assertNoPiiInOrsPayload(payload: unknown): void {
  if (payload === null || typeof payload !== "object") return;

  if (Array.isArray(payload)) {
    for (const item of payload) assertNoPiiInOrsPayload(item);
    return;
  }

  for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
    if (PII_FIELD_PATTERN.test(key)) {
      throw new Error(`PII_FIELD_IN_ORS_PAYLOAD:${key}`);
    }
    if (typeof value === "string" && value.length > 120) {
      throw new Error("FREE_TEXT_IN_ORS_PAYLOAD");
    }
    assertNoPiiInOrsPayload(value);
  }
}

export function stripAddressForExternalUse(_address: string): never {
  throw new Error(
    "Addresses must not be sent to external routing APIs; use coordinate resolution server-side."
  );
}
