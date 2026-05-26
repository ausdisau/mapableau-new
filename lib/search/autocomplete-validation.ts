import { z } from "zod";

import {
  AUTOCOMPLETE_MAX_SUGGESTIONS,
  AUTOCOMPLETE_MIN_QUERY_LENGTH,
} from "@/types/search";

export const autocompleteQuerySchema = z.object({
  q: z.string().trim().min(AUTOCOMPLETE_MIN_QUERY_LENGTH).max(120),
  context: z.enum(["homepage", "provider_finder"]),
  field: z
    .enum([
      "all",
      "provider",
      "service",
      "location",
      "postcode",
      "accessibility",
      "language",
    ])
    .optional()
    .default("all"),
});

const autocompleteSuggestionMetadataSchema = z
  .object({
    slug: z.string().min(1).max(240).optional(),
    suburb: z.string().min(1).max(160).optional(),
    state: z.string().min(1).max(32).optional(),
    postcode: z.string().min(1).max(16).optional(),
    legacyProviderId: z.string().min(1).max(320).optional(),
    providerProfileId: z.string().min(1).max(120).optional(),
    providerId: z.string().min(1).max(320).optional(),
    outletName: z.string().min(1).max(240).optional(),
  })
  .strict();

export const autocompleteSuggestionSchema = z
  .object({
    id: z.string().min(1).max(320),
    type: z.enum([
      "provider",
      "service",
      "location",
      "accessibility_feature",
      "language",
      "popular_search",
    ]),
    label: z.string().min(1).max(240),
    description: z.string().min(1).max(320).optional(),
    typeLabel: z.string().min(1).max(80),
    value: z.string().min(1).max(240),
    metadata: autocompleteSuggestionMetadataSchema.optional(),
  })
  .strict();

export const autocompleteGroupedResultSchema = z
  .object({
    providers: z.array(autocompleteSuggestionSchema),
    services: z.array(autocompleteSuggestionSchema),
    locations: z.array(autocompleteSuggestionSchema),
    accessibilityFeatures: z.array(autocompleteSuggestionSchema),
    languages: z.array(autocompleteSuggestionSchema),
    popularSearches: z.array(autocompleteSuggestionSchema),
  })
  .strict();

export const autocompleteResponseSchema = z
  .object({
    groups: autocompleteGroupedResultSchema,
  })
  .strict();

export type AutocompleteQueryParams = z.infer<typeof autocompleteQuerySchema>;

export { AUTOCOMPLETE_MAX_SUGGESTIONS, AUTOCOMPLETE_MIN_QUERY_LENGTH };
