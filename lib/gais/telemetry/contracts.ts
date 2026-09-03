import { z } from "zod";

import { assertNoActuationCommands } from "./actuation-guard";

export const GAIS_OBSERVATION_TYPES = [
  "TEMPORARY_OBSTRUCTION",
  "PATH_WIDTH_ESTIMATE",
  "SURFACE_CHANGE",
  "DOORWAY_ESTIMATE",
] as const;

export type GaisObservationType = (typeof GAIS_OBSERVATION_TYPES)[number];

export const GAIS_TELEMETRY_SOURCE_CLASSES = [
  "pilot_device",
  "development_simulator",
  "synthetic_fixture",
] as const;

export type GaisTelemetrySourceClass =
  (typeof GAIS_TELEMETRY_SOURCE_CLASSES)[number];

/**
 * Sensor ingest verification state.
 * SENSOR_OBSERVED never auto-promotes to VERIFIED.
 */
export const GAIS_TELEMETRY_VERIFICATION_STATES = [
  "SENSOR_OBSERVED",
] as const;

export type GaisTelemetryVerificationState =
  (typeof GAIS_TELEMETRY_VERIFICATION_STATES)[number];

export const GAIS_PROMOTION_STATES = [
  "received",
  "validated",
  "candidate_evidence",
  "moderation",
  "published",
  "rejected",
] as const;

export type GaisPromotionState = (typeof GAIS_PROMOTION_STATES)[number];

export const accessibilityObservationGeometrySchema = z.object({
  type: z.literal("Point"),
  coordinates: z.tuple([
    z.number().min(-180).max(180),
    z.number().min(-90).max(90),
  ]),
});

export const accessibilityObservationValuesSchema = z
  .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
  .refine((v) => Object.keys(v).length <= 32, {
    message: "values may contain at most 32 keys",
  });

export const accessibilityObservationIngestSchema = z
  .object({
    sourceDeviceId: z.string().min(1).max(128),
    sourceClass: z.enum(GAIS_TELEMETRY_SOURCE_CLASSES),
    observedAt: z.string().datetime(),
    geometry: accessibilityObservationGeometrySchema,
    observationType: z.enum(GAIS_OBSERVATION_TYPES),
    values: accessibilityObservationValuesSchema.default({}),
    confidence: z.number().min(0).max(1).optional(),
    synthetic: z.boolean().optional(),
    placeId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const actuation = assertNoActuationCommands(data);
    if (!actuation.ok) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Actuation commands are outside GAIS: ${actuation.forbidden.join(", ")}`,
        path: ["values"],
      });
    }
  });

export type AccessibilityObservationIngest = z.infer<
  typeof accessibilityObservationIngestSchema
>;

export type AccessibilityObservation = {
  observationId: string;
  sourceDeviceId: string;
  sourceClass: GaisTelemetrySourceClass;
  observedAt: string;
  geometry: { type: "Point"; coordinates: [number, number] };
  observationType: GaisObservationType;
  values: Record<string, string | number | boolean | null>;
  confidence?: number;
  /** Always SENSOR_OBSERVED on ingest — never VERIFIED from sensor alone. */
  verificationState: "SENSOR_OBSERVED";
  promotionState: GaisPromotionState;
  synthetic: boolean;
  placeId?: string;
  receivedAt: string;
  /** Ingesting account — never exposed on public read surfaces. */
  ingestedByUserId?: string;
};

/** Public-safe projection — strips participant identity. */
export type AccessibilityObservationPublic = Omit<
  AccessibilityObservation,
  "ingestedByUserId"
>;

export function toPublicObservation(
  obs: AccessibilityObservation,
): AccessibilityObservationPublic {
  const { ingestedByUserId: _private, ...publicObs } = obs;
  return publicObs;
}
