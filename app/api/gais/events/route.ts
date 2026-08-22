import { NextRequest } from "next/server";
import { z } from "zod";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  GAIS_RESPONSE_META,
  gaisFeatureDisabledResponse,
  mapableGaisFlags,
} from "@/lib/config/mapable-gais";
import { listAccessConditions, parseActiveAt } from "@/lib/gais/conditions";
import { gaisBoundsSchema } from "@/lib/gais/contracts/bounds";

const eventsQuerySchema = z.object({
  activeAt: z.string().datetime().optional(),
  placeId: z.string().optional(),
  graphId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

export async function GET(req: NextRequest) {
  if (!mapableGaisFlags.readEnabled) {
    return gaisFeatureDisabledResponse("MAPABLE_GAIS_PUBLIC_API_ENABLED");
  }

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsedQuery = eventsQuerySchema.safeParse(params);
  if (!parsedQuery.success) return zodErrorResponse(parsedQuery.error);

  const hasBounds = ["minLat", "minLng", "maxLat", "maxLng"].every((k) => k in params);

  let bounds: z.infer<typeof gaisBoundsSchema> | undefined;
  if (hasBounds) {
    const parsedBounds = gaisBoundsSchema.safeParse(params);
    if (!parsedBounds.success) return zodErrorResponse(parsedBounds.error);
    bounds = parsedBounds.data;
  }

  let activeAt: Date;
  try {
    activeAt = parseActiveAt(parsedQuery.data.activeAt);
  } catch {
    return jsonError("Invalid activeAt timestamp", 400);
  }

  const events = await listAccessConditions({
    bounds,
    placeId: parsedQuery.data.placeId,
    graphId: parsedQuery.data.graphId,
    activeAt,
    limit: parsedQuery.data.limit ?? bounds?.limit,
  });

  return jsonOk({
    layer: "Access Conditions",
    events,
    activeAt: activeAt.toISOString(),
    meta: {
      ...GAIS_RESPONSE_META,
      generatedAt: new Date().toISOString(),
      eventCount: events.length,
      internalConcept: "GAIS Temporal Accessibility Events",
      forecasting: false,
      note: "Factual, time-aware conditions from community reports and reviewed temporary changes. Not predictive access weather.",
    },
  });
}
