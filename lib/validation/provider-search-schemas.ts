import { z } from "zod";

import { RADIUS_KM_OPTIONS } from "@/types/location";

export const providerSearchSortSchema = z.enum([
  "relevance",
  "distance",
  "rating",
]);

export const providerSearchQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  location: z.string().trim().max(120).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce
    .number()
    .refine(
      (n) => RADIUS_KM_OPTIONS.includes(n as (typeof RADIUS_KM_OPTIONS)[number]),
      { message: "radiusKm must be one of 5, 10, 25, 50, 100" },
    )
    .optional(),
  sort: providerSearchSortSchema.optional().default("relevance"),
  limit: z.coerce.number().int().min(1).max(500).optional().default(100),
});

export type ProviderSearchQuery = z.infer<typeof providerSearchQuerySchema>;

export function validateLocationSearchParams(
  lat?: number,
  lng?: number,
  radiusKm?: number,
): { ok: true } | { ok: false; error: string } {
  if (lat == null && lng == null && radiusKm == null) return { ok: true };
  if (lat == null || lng == null) {
    return { ok: false, error: "lat and lng are required together" };
  }
  if (radiusKm != null && radiusKm > 100) {
    return { ok: false, error: "radiusKm must not exceed 100 km" };
  }
  return { ok: true };
}
