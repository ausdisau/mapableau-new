import { NextRequest } from "next/server";

import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  GAIS_RESPONSE_META,
  gaisFeatureDisabledResponse,
  mapableGaisFlags,
} from "@/lib/config/mapable-gais";
import { gaisBoundsSchema } from "@/lib/gais/contracts/bounds";
import { gaisFeaturesToFeatureCollection } from "@/lib/gais/geojson";
import { listGaisFeaturesInBounds } from "@/lib/gais/service";

export async function GET(req: NextRequest) {
  if (!mapableGaisFlags.readEnabled) {
    return gaisFeatureDisabledResponse("MAPABLE_GAIS_PUBLIC_API_ENABLED");
  }

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = gaisBoundsSchema.safeParse(params);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  const features = await listGaisFeaturesInBounds(parsed.data);
  const collection = gaisFeaturesToFeatureCollection(features, {
    claimState: GAIS_RESPONSE_META.claimState,
    evidenceScope: GAIS_RESPONSE_META.evidenceScope,
  });

  return jsonOk({
    type: collection.type,
    features: collection.features,
    meta: collection.meta,
  });
}
