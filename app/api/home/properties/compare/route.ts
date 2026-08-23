import { z } from "zod";

import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { homeLivingConfig } from "@/lib/config/abilitypay-home-living";
import {
  comparePublishedProperties,
  HomeCompareDisabledError,
} from "@/lib/home-living/discovery/compare-service";

export async function GET(request: Request) {
  if (
    !homeLivingConfig.enabled ||
    !homeLivingConfig.discoveryEnabled ||
    !homeLivingConfig.compareEnabled
  ) {
    return jsonError("Home compare is disabled", 404);
  }

  const url = new URL(request.url);
  const parsed = z
    .object({
      ids: z.string().min(1),
      requirements: z.string().optional(),
    })
    .safeParse({
      ids: url.searchParams.get("ids") ?? "",
      requirements: url.searchParams.get("requirements") ?? undefined,
    });
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const propertyIds = parsed.data.ids
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 4);
  if (propertyIds.length < 2) {
    return jsonError("Provide at least two property ids", 400);
  }

  try {
    const comparison = await comparePublishedProperties({
      propertyIds,
      selectedRequirements: parsed.data.requirements
        ? parsed.data.requirements.split("|").map((r) => r.trim())
        : [],
    });
    return jsonOk(comparison);
  } catch (error) {
    if (error instanceof HomeCompareDisabledError) {
      return jsonError("Home compare is disabled", 404);
    }
    return jsonError("Unable to compare properties", 500);
  }
}
