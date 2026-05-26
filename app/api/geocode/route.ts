import { z } from "zod";

import {
  geocodeAddress,
  GeocodingProviderError,
} from "@/lib/map/geocoding-service";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";

const geocodeQuerySchema = z.object({
  q: z.string().trim().min(2).max(240),
  limit: z.coerce.number().int().min(1).max(10).default(5),
  country: z
    .string()
    .trim()
    .length(2)
    .default("AU")
    .transform((value) => value.toUpperCase()),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = geocodeQuerySchema.safeParse({
    q: url.searchParams.get("q") ?? "",
    limit: url.searchParams.get("limit") ?? undefined,
    country: url.searchParams.get("country") ?? undefined,
  });

  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const results = await geocodeAddress({
      query: parsed.data.q,
      limit: parsed.data.limit,
      country: parsed.data.country,
    });

    return jsonOk({ results });
  } catch (error) {
    if (error instanceof GeocodingProviderError) {
      return jsonError("Geocoding service unavailable", 503);
    }

    return jsonError("Geocoding failed", 502);
  }
}
