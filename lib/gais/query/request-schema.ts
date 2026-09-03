import { z } from "zod";

import { accessRequirementsSchema } from "@/lib/gais/compatibility/contracts";
import { GAIS_FEATURE_TYPES } from "@/lib/gais/contracts/feature-types";
import { gaisBoundsSchema } from "@/lib/gais/contracts/bounds";

import {
  GAIS_QUERY_DEFAULT_LIMIT,
  GAIS_QUERY_OBJECTIVES,
  GAIS_MAX_RADIUS_METRES,
} from "./constants";

export const gaisQueryLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radiusMetres: z.number().int().min(1).max(GAIS_MAX_RADIUS_METRES),
});

export const gaisQueryEvidenceRequirementsSchema = z.object({
  requiresKnownStepFreeEntrance: z.boolean().optional(),
  requiresAccessibleToiletEvidence: z.boolean().optional(),
});

export const gaisStructuredQuerySchema = z
  .object({
    bounds: gaisBoundsSchema.optional(),
    location: gaisQueryLocationSchema.optional(),
    featureTypes: z.array(z.enum(GAIS_FEATURE_TYPES)).optional(),
    accessFeatureTags: z.array(z.string()).optional(),
    requirements: accessRequirementsSchema.optional(),
    evidenceRequirements: gaisQueryEvidenceRequirementsSchema.optional(),
    includeEvents: z.boolean().optional(),
    unknownOnly: z.boolean().optional(),
    activeAt: z.string().datetime().optional(),
    limit: z.number().int().min(1).max(500).optional(),
    objectives: z.array(z.enum(GAIS_QUERY_OBJECTIVES)).max(3).optional(),
    participantEditableSummary: z.string().min(1).max(500).optional(),
  })
  .refine((q) => q.bounds != null || q.location != null, {
    message: "Provide bounds or location with radiusMetres",
    path: ["bounds"],
  });

export type GaisStructuredQuery = z.infer<typeof gaisStructuredQuerySchema>;
