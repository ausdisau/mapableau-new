import { z } from "zod";

export const nlSearchRequestSchema = z.object({
  query: z.string().trim().min(2).max(500),
});

export type NlSearchRequest = z.infer<typeof nlSearchRequestSchema>;

const filterField = z.string().trim().max(200).optional().default("");

export const geminiNlFiltersSchema = z.object({
  q: filterField,
  location: filterField,
  access: filterField,
  service: filterField,
  provider: filterField,
});

export type GeminiNlFilters = z.infer<typeof geminiNlFiltersSchema>;
