import { z } from "zod";

import {
  AUTOCOMPLETE_MAX_SUGGESTIONS,
  AUTOCOMPLETE_MIN_QUERY_LENGTH,
} from "@/types/search";

export const autocompleteQuerySchema = z
  .object({
    q: z.string().trim().max(120).default(""),
    context: z.enum(["homepage", "provider_finder"]),
    field: z
      .enum(["all", "provider", "service", "location", "accessibility", "language"])
      .optional()
      .default("all"),
    predictive: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => value === "true")
      .default("false"),
  })
  .superRefine((data, ctx) => {
    if (!data.predictive && data.q.length < AUTOCOMPLETE_MIN_QUERY_LENGTH) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Query must be at least ${AUTOCOMPLETE_MIN_QUERY_LENGTH} characters`,
        path: ["q"],
      });
    }
  });

export type AutocompleteQueryParams = z.infer<typeof autocompleteQuerySchema>;

export { AUTOCOMPLETE_MAX_SUGGESTIONS, AUTOCOMPLETE_MIN_QUERY_LENGTH };
