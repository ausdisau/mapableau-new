import { z } from "zod";

/** Maximum bounding box span in degrees (~220 km at equator). */
export const GAIS_MAX_BOUNDS_SPAN_DEGREES = 2;

/** Maximum features returned per bounds query. */
export const GAIS_MAX_FEATURES_PER_QUERY = 500;

export const gaisBoundsSchema = z
  .object({
    minLat: z.coerce.number().min(-90).max(90),
    minLng: z.coerce.number().min(-180).max(180),
    maxLat: z.coerce.number().min(-90).max(90),
    maxLng: z.coerce.number().min(-180).max(180),
    limit: z.coerce.number().int().min(1).max(GAIS_MAX_FEATURES_PER_QUERY).optional(),
  })
  .refine((b) => b.minLat < b.maxLat, {
    message: "minLat must be less than maxLat",
    path: ["minLat"],
  })
  .refine((b) => b.minLng < b.maxLng, {
    message: "minLng must be less than maxLng",
    path: ["minLng"],
  })
  .refine(
    (b) =>
      b.maxLat - b.minLat <= GAIS_MAX_BOUNDS_SPAN_DEGREES &&
      b.maxLng - b.minLng <= GAIS_MAX_BOUNDS_SPAN_DEGREES,
    {
      message: `Bounding box exceeds maximum span of ${GAIS_MAX_BOUNDS_SPAN_DEGREES} degrees`,
      path: ["maxLat"],
    },
  );

export type GaisBounds = z.infer<typeof gaisBoundsSchema>;
