import { z } from "zod";

export const mapBboxQuerySchema = z.object({
  minLat: z.coerce.number().min(-90).max(90),
  minLng: z.coerce.number().min(-180).max(180),
  maxLat: z.coerce.number().min(-90).max(90),
  maxLng: z.coerce.number().min(-180).max(180),
});

export type MapBbox = z.infer<typeof mapBboxQuerySchema>;

export function parseMapBboxFromSearchParams(
  searchParams: URLSearchParams,
): MapBbox | null {
  const keys = ["minLat", "minLng", "maxLat", "maxLng"] as const;
  if (keys.some((key) => !searchParams.get(key)?.trim())) {
    return null;
  }

  const parsed = mapBboxQuerySchema.safeParse({
    minLat: searchParams.get("minLat"),
    minLng: searchParams.get("minLng"),
    maxLat: searchParams.get("maxLat"),
    maxLng: searchParams.get("maxLng"),
  });
  return parsed.success ? parsed.data : null;
}

export function pointInBbox(
  lat: number,
  lng: number,
  bbox: MapBbox,
): boolean {
  return (
    lat >= bbox.minLat &&
    lat <= bbox.maxLat &&
    lng >= bbox.minLng &&
    lng <= bbox.maxLng
  );
}
