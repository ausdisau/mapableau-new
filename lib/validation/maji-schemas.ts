import { z } from "zod";

import { JOURNEY_OPTIMISATION_PREFERENCES } from "@/types/maji";

const latLngSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const journeyAdviceEvaluateSchema = z.object({
  preference: z.enum(JOURNEY_OPTIMISATION_PREFERENCES).default("balanced"),
  syntheticOrigin: latLngSchema.optional(),
});

export const journeyAdviceDecisionSchema = z.object({
  decision: z.enum(["acknowledged", "dismissed", "referred"]),
});

export type JourneyAdviceEvaluateInput = z.infer<
  typeof journeyAdviceEvaluateSchema
>;
export type JourneyAdviceDecisionInput = z.infer<
  typeof journeyAdviceDecisionSchema
>;
