import { z } from "zod";

/**
 * Public-safe feature projection — no participant/contributor identity.
 */

export const publicAccessFeatureSchema = z
  .object({
    featureId: z.string().min(1),
    featureType: z.string().min(1),
    attribute: z.string().min(1),
    value: z.union([
      z.string(),
      z.number(),
      z.boolean(),
      z.literal("UNKNOWN"),
      z.null(),
    ]),
    valueQualifier: z.enum(["MEASURED", "ESTIMATED", "EXPERIENCED", "UNKNOWN"]),
    geometry: z
      .object({
        type: z.literal("Point"),
        coordinates: z.tuple([z.number(), z.number()]),
      })
      .optional(),
    placeId: z.string().optional(),
    observedAt: z.string().optional(),
    verificationState: z.enum([
      "UNVERIFIED",
      "COMMUNITY_REPORTED",
      "CORROBORATED",
      "OPERATOR_CONFIRMED",
      "PROFESSIONALLY_VERIFIED",
      "DISPUTED",
      "STALE",
    ]),
    attributionLabel: z.string().optional(),
    licence: z.string().optional(),
    sourceProvider: z.string().min(1),
  })
  .strict();

export type PublicAccessFeature = z.infer<typeof publicAccessFeatureSchema>;

export const publicFeatureListSchema = z
  .object({
    features: z.array(publicAccessFeatureSchema),
    pagination: z
      .object({
        page: z.number().int().positive(),
        pageSize: z.number().int().positive(),
        total: z.number().int().nonnegative(),
        hasMore: z.boolean(),
      })
      .optional(),
    bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
  })
  .strict();

export type PublicFeatureList = z.infer<typeof publicFeatureListSchema>;

export const bboxQuerySchema = z
  .object({
    minLng: z.coerce.number(),
    minLat: z.coerce.number(),
    maxLng: z.coerce.number(),
    maxLat: z.coerce.number(),
  })
  .strict();

export const paginationQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
