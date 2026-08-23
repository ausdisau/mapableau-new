import { z } from "zod";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { homeLivingConfig } from "@/lib/config/abilitypay-home-living";
import {
  HomeDiscoveryDisabledError,
  searchPublishedProperties,
} from "@/lib/home-living/discovery/property-discovery-service";

export async function GET(request: Request) {
  if (!homeLivingConfig.enabled || !homeLivingConfig.discoveryEnabled) {
    return jsonError("Home discovery is disabled", 404);
  }

  const url = new URL(request.url);
  const parsed = z
    .object({
      suburb: z.string().optional(),
      propertyType: z.string().optional(),
      bedroomCount: z.coerce.number().int().nonnegative().optional(),
      availabilityStatus: z.string().optional(),
      sdaCategory: z.string().optional(),
      accessibilityFeatures: z.string().optional(),
      limit: z.coerce.number().int().positive().max(100).optional(),
    })
    .safeParse({
      suburb: url.searchParams.get("suburb") ?? undefined,
      propertyType: url.searchParams.get("propertyType") ?? undefined,
      bedroomCount: url.searchParams.get("bedroomCount") ?? undefined,
      availabilityStatus:
        url.searchParams.get("availabilityStatus") ?? undefined,
      sdaCategory: url.searchParams.get("sdaCategory") ?? undefined,
      accessibilityFeatures:
        url.searchParams.get("accessibilityFeatures") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
    });
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const properties = await searchPublishedProperties({
      ...parsed.data,
      accessibilityFeatures: parsed.data.accessibilityFeatures
        ? parsed.data.accessibilityFeatures.split(",").map((s) => s.trim())
        : undefined,
    });
    return jsonOk({ properties });
  } catch (error) {
    if (error instanceof HomeDiscoveryDisabledError) {
      return jsonError("Home discovery is disabled", 404);
    }
    return jsonError("Unable to search properties", 500);
  }
}
