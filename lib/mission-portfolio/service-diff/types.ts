import { z } from "zod";

/** Arrangement keys that may appear in a What Changed comparison. */
export const ServiceArrangementFieldSchema = z.enum([
  "worker",
  "provider",
  "vehicle",
  "driver",
  "venue",
  "entrance",
  "route",
  "support_time",
  "agreement",
  "price",
  "equipment",
  "communication_acknowledgement",
  "funding_route",
]);

export type ServiceArrangementField = z.infer<
  typeof ServiceArrangementFieldSchema
>;

export const ServiceArrangementSchema = z
  .object({
    fields: z.record(ServiceArrangementFieldSchema, z.string().nullable()),
  })
  .strict();

export type ServiceArrangement = z.infer<typeof ServiceArrangementSchema>;

export const ServiceChangeImpactSchema = z
  .object({
    access: z.enum(["none", "changed", "unknown"]),
    communication: z.enum(["none", "changed", "unknown"]),
    price: z.enum(["none", "changed", "unknown"]),
    timing: z.enum(["none", "changed", "unknown"]),
    evidence: z.enum(["none", "changed", "unknown"]),
  })
  .strict();

export const ServiceChangeDiffSchema = z
  .object({
    prior: ServiceArrangementSchema,
    proposed: ServiceArrangementSchema,
    unchanged: z.array(ServiceArrangementFieldSchema),
    changed: z.array(
      z
        .object({
          field: ServiceArrangementFieldSchema,
          from: z.string().nullable(),
          to: z.string().nullable(),
        })
        .strict(),
    ),
    newlyMissing: z.array(ServiceArrangementFieldSchema),
    newUnknowns: z.array(ServiceArrangementFieldSchema),
    impact: ServiceChangeImpactSchema,
    participantActionRequired: z.boolean(),
    /** Diff is deterministic text — never model-authored conclusions. */
    authoritativeConclusions: z.literal(false),
  })
  .strict();

export type ServiceChangeDiff = z.infer<typeof ServiceChangeDiffSchema>;
