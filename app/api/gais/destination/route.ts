import { z } from "zod";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  GAIS_RESPONSE_META,
  gaisFeatureDisabledResponse,
  mapableGaisFlags,
} from "@/lib/config/mapable-gais";
import {
  resolveDestinationByPlaceId,
  resolveDestinationByQuery,
} from "@/lib/gais/destination";

const destinationRequestSchema = z
  .object({
    placeId: z.string().min(1).optional(),
    query: z.string().min(1).max(200).optional(),
    limit: z.number().int().min(1).max(20).optional(),
  })
  .refine((b) => Boolean(b.placeId || b.query), {
    message: "Provide placeId or query",
    path: ["placeId"],
  });

export async function POST(req: Request) {
  if (!mapableGaisFlags.destinationEnabled) {
    return gaisFeatureDisabledResponse("MAPABLE_GAIS_DESTINATION_ENABLED");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = destinationRequestSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  if (parsed.data.placeId) {
    const resolution = await resolveDestinationByPlaceId(parsed.data.placeId);
    if (!resolution) return jsonError("Place not found", 404);

    return jsonOk({
      destination: resolution,
      meta: {
        ...GAIS_RESPONSE_META,
        ...resolution.meta,
      },
    });
  }

  const results = await resolveDestinationByQuery({
    query: parsed.data.query!,
    limit: parsed.data.limit,
  });

  return jsonOk({
    destinations: results,
    meta: {
      ...GAIS_RESPONSE_META,
      resultCount: results.length,
      indoorNavigation: false,
      fabricatedCoordinates: false,
      note: "Name match against published AccessPlace records only. Arrival coordinates remain UNKNOWN unless recorded.",
    },
  });
}
