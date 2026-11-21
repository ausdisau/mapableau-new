import { z } from "zod";

/**
 * Phase 0 transport-control event contracts.
 * No precise GPS / raw address fields — status and assignment only.
 * Live Socket.IO publish is intentionally not wired here.
 */

export const transportControlEventTypeSchema = z.enum([
  "transport.trip.status_changed",
  "transport.trip.assigned",
  "transport.trip.unassigned",
  "transport.trip.schedule_conflict",
  "transport.route.advisory_ready",
]);

export type TransportControlEventType = z.infer<
  typeof transportControlEventTypeSchema
>;

/** Shared envelope: monotonic aggregateVersion + sequence for gap detection. */
export const transportControlEventEnvelopeSchema = z.object({
  id: z.string().min(1),
  type: transportControlEventTypeSchema,
  tripId: z.string().min(1),
  organisationId: z.string().min(1).optional(),
  /** Monotonic per-trip aggregate version (assignment/status revisions). */
  aggregateVersion: z.number().int().positive(),
  /** Monotonic stream sequence for the consumer (outbox / socket cursor). */
  sequence: z.number().int().nonnegative(),
  occurredAt: z.string().datetime(),
  correlationId: z.string().min(1).optional(),
  /** Recommended: append to CloudEventOutbox before any future broadcast. */
  outboxRecommended: z.literal(true).default(true),
});

export const transportStatusChangedPayloadSchema = z.object({
  fromStatus: z.string().nullable(),
  toStatus: z.string().min(1),
  actorUserId: z.string().optional(),
});

export const transportAssignedPayloadSchema = z.object({
  driverId: z.string().min(1),
  vehicleId: z.string().min(1),
  idempotencyKey: z.string().min(1).optional(),
  /** Room grant generation — clients must re-mint after reassignment. */
  roomGrantGeneration: z.number().int().nonnegative(),
});

export const transportUnassignedPayloadSchema = z.object({
  previousDriverId: z.string().optional(),
  previousVehicleId: z.string().optional(),
  roomGrantGeneration: z.number().int().nonnegative(),
});

export const transportScheduleConflictPayloadSchema = z.object({
  conflictTypes: z.array(z.string().min(1)).min(1),
  driverId: z.string().optional(),
  vehicleId: z.string().optional(),
});

export const transportAdvisoryRoutePayloadSchema = z.object({
  estimateId: z.string().min(1),
  provider: z.string().min(1),
  advisoryOnly: z.literal(true),
  /** Never treat mock as live ETA. */
  sourceLabel: z.string().min(1),
});

export const transportControlEventSchema = z.discriminatedUnion("type", [
  transportControlEventEnvelopeSchema.extend({
    type: z.literal("transport.trip.status_changed"),
    payload: transportStatusChangedPayloadSchema,
  }),
  transportControlEventEnvelopeSchema.extend({
    type: z.literal("transport.trip.assigned"),
    payload: transportAssignedPayloadSchema,
  }),
  transportControlEventEnvelopeSchema.extend({
    type: z.literal("transport.trip.unassigned"),
    payload: transportUnassignedPayloadSchema,
  }),
  transportControlEventEnvelopeSchema.extend({
    type: z.literal("transport.trip.schedule_conflict"),
    payload: transportScheduleConflictPayloadSchema,
  }),
  transportControlEventEnvelopeSchema.extend({
    type: z.literal("transport.route.advisory_ready"),
    payload: transportAdvisoryRoutePayloadSchema,
  }),
]);

export type TransportControlEvent = z.infer<typeof transportControlEventSchema>;

/** Reject envelopes that smuggle precise location. */
const FORBIDDEN_LOCATION_KEYS = new Set([
  "lat",
  "lng",
  "latitude",
  "longitude",
  "coordinates",
  "exactAddress",
  "gps",
  "rawLocation",
]);

export function assertNoRealLocationFields(
  value: unknown,
  path: string[] = []
): void {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, i) => assertNoRealLocationFields(item, [...path, String(i)]));
    return;
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_LOCATION_KEYS.has(key)) {
      throw new Error(
        `Transport control event must not include real location field "${[...path, key].join(".")}"`
      );
    }
    assertNoRealLocationFields(child, [...path, key]);
  }
}

export function parseTransportControlEvent(input: unknown): TransportControlEvent {
  const parsed = transportControlEventSchema.parse(input);
  assertNoRealLocationFields(parsed);
  return parsed;
}
