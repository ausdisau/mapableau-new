import { z } from "zod";

import { bboxQuerySchema, paginationQuerySchema } from "./types";

export function parseBboxFromSearchParams(
  params: URLSearchParams,
): z.infer<typeof bboxQuerySchema> | null {
  const minLng = params.get("minLng");
  const minLat = params.get("minLat");
  const maxLng = params.get("maxLng");
  const maxLat = params.get("maxLat");
  if (!minLng || !minLat || !maxLng || !maxLat) return null;
  return bboxQuerySchema.parse({
    minLng,
    minLat,
    maxLng,
    maxLat,
  });
}

export function parsePaginationFromSearchParams(
  params: URLSearchParams,
): z.infer<typeof paginationQuerySchema> {
  return paginationQuerySchema.parse({
    page: params.get("page") ?? 1,
    pageSize: params.get("pageSize") ?? 20,
  });
}

export function featureInBbox(
  feature: { geometry?: { coordinates: [number, number] } },
  bbox: z.infer<typeof bboxQuerySchema>,
): boolean {
  if (!feature.geometry) return false;
  const [lng, lat] = feature.geometry.coordinates;
  return (
    lng >= bbox.minLng &&
    lng <= bbox.maxLng &&
    lat >= bbox.minLat &&
    lat <= bbox.maxLat
  );
}
