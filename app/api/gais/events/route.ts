import { NextRequest } from "next/server";

import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  GAIS_RESPONSE_META,
  gaisFeatureDisabledResponse,
  mapableGaisFlags,
} from "@/lib/config/mapable-gais";
import { gaisBoundsSchema } from "@/lib/gais/contracts/bounds";
import { listActiveAccessibilityEvents } from "@/lib/gais/service";

export async function GET(req: NextRequest) {
  if (!mapableGaisFlags.readEnabled) {
    return gaisFeatureDisabledResponse("MAPABLE_GAIS_PUBLIC_API_ENABLED");
  }

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const hasBounds = ["minLat", "minLng", "maxLat", "maxLng"].every((k) => k in params);

  let bounds: Parameters<typeof listActiveAccessibilityEvents>[0];
  if (hasBounds) {
    const parsed = gaisBoundsSchema.safeParse(params);
    if (!parsed.success) return zodErrorResponse(parsed.error);
    bounds = parsed.data;
  }

  const events = await listActiveAccessibilityEvents(bounds);

  return jsonOk({
    events,
    meta: {
      ...GAIS_RESPONSE_META,
      generatedAt: new Date().toISOString(),
      eventCount: events.length,
      note: "Temporary conditions from community reports. Sandbox route graph barriers may apply.",
    },
  });
}
