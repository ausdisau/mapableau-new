import { createHash } from "crypto";

import { z } from "zod";

export const ShiftTelemetrySchema = z.object({
  latitude: z.number().finite().gte(-90).lte(90),
  longitude: z.number().finite().gte(-180).lte(180),
  accuracyMeters: z.number().finite().positive(),
  timestamp: z.string().datetime(),
});

export type ShiftTelemetry = z.infer<typeof ShiftTelemetrySchema>;

export type PaceCheckOutTelemetryEntry = {
  kind: "pace_telemetry_check_out";
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  timestamp: string;
  durationMinutes: number;
  geofenceDistanceMeters: number;
  geofenceWithinRadius: boolean;
  telemetryHash: string;
};

/** SHA-256 of lat|lng|timestamp for immutable claim linkage (no free-text coords). */
export function hashShiftTelemetry(telemetry: {
  latitude: number;
  longitude: number;
  timestamp: string;
}): string {
  const material = `${telemetry.latitude}|${telemetry.longitude}|${telemetry.timestamp}`;
  return createHash("sha256").update(material).digest("hex");
}

/** Prefer client timestamp when within ±15 minutes of server now. */
export function resolveTelemetryTimestamp(clientIso: string, serverNow = new Date()): Date {
  const client = new Date(clientIso);
  if (!Number.isFinite(client.getTime())) return serverNow;
  const deltaMs = Math.abs(client.getTime() - serverNow.getTime());
  const fifteenMin = 15 * 60 * 1000;
  return deltaMs <= fifteenMin ? client : serverNow;
}
