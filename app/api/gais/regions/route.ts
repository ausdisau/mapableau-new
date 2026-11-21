import { NextRequest } from "next/server";
import { z } from "zod";

import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  gaisFeatureDisabledResponse,
  mapableGaisFlags,
} from "@/lib/config/mapable-gais";
import {
  listRegionalDemandFeatures,
  toPublicRegionalDemandFeatureCollection,
} from "@/lib/gais/regional-demand";

const bboxSchema = z
  .string()
  .transform((value) => value.split(",").map(Number))
  .refine(
    (values) =>
      values.length === 4 &&
      values.every((value) => Number.isFinite(value)),
    "bbox must contain minLng,minLat,maxLng,maxLat",
  )
  .transform(([minLng, minLat, maxLng, maxLat]) => ({
    minLng,
    minLat,
    maxLng,
    maxLat,
  }))
  .refine((bounds) => bounds.minLng < bounds.maxLng, {
    message: "minLng must be less than maxLng",
  })
  .refine((bounds) => bounds.minLat < bounds.maxLat, {
    message: "minLat must be less than maxLat",
  });

const querySchema = z.object({
  level: z.enum(["SA3", "SA2", "LGA"]),
  bbox: bboxSchema.optional(),
});

export async function GET(req: NextRequest) {
  if (!mapableGaisFlags.readEnabled || !mapableGaisFlags.regionalDemandEnabled) {
    return gaisFeatureDisabledResponse(
      "MAPABLE_GAIS_REGIONAL_DEMAND_ENABLED",
    );
  }

  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  const features = await listRegionalDemandFeatures({
    level: parsed.data.level,
    bounds: parsed.data.bbox,
  });
  return jsonOk(toPublicRegionalDemandFeatureCollection(features));
}
