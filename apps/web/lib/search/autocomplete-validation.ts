import { z } from "zod";

import {
  AUTOCOMPLETE_MAX_SUGGESTIONS,
  AUTOCOMPLETE_MIN_QUERY_LENGTH,
} from "@/types/search";

export const autocompleteQuerySchema = z.object({
  q: z.string().trim().min(AUTOCOMPLETE_MIN_QUERY_LENGTH).max(120),
  context: z.enum(["homepage", "provider_finder"]),
  field: z
    .enum(["all", "provider", "service", "location", "accessibility", "language"])
    .optional()
    .default("all"),
});

export type AutocompleteQueryParams = z.infer<typeof autocompleteQuerySchema>;

export { AUTOCOMPLETE_MAX_SUGGESTIONS, AUTOCOMPLETE_MIN_QUERY_LENGTH };
