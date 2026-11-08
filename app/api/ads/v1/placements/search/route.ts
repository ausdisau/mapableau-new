import { z } from "zod";

import { userHasAdsPermission } from "@/lib/ads/auth/ads-permissions";
import {
  assertPlacementApiEnabled,
  placementApiDisabledResponse,
} from "@/lib/ads/manager/flag-gate";
import { searchPlacementOpportunities } from "@/lib/ads/placement/search";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { apiForbidden, apiUnauthorized, getApiUser } from "@/lib/auth/guards";

const searchSchema = z.object({
  channels: z
    .array(z.enum(["mapable", "meta", "google", "tiktok", "linkedin", "dooh"]))
    .optional(),
  region: z
    .object({
      country: z.string().length(2),
      state: z.string().optional(),
      locality: z.string().optional(),
    })
    .optional(),
  flight: z
    .object({
      start: z.string().min(1),
      end: z.string().min(1),
      timeZone: z.string().min(1),
    })
    .optional(),
  budget: z
    .object({
      amountMinor: z.number().int().nonnegative(),
      currency: z.string().length(3),
    })
    .optional(),
  creative: z
    .object({
      format: z.string().min(1),
      aspectRatio: z.string().optional(),
      captioned: z.boolean().optional(),
    })
    .optional(),
  targeting: z
    .object({
      kind: z.literal("contextual"),
      dayparts: z.array(z.string()).optional(),
    })
    .optional(),
});

/** POST /api/ads/v1/placements/search — eligible opportunities, no spend. */
export async function POST(request: Request) {
  if (!assertPlacementApiEnabled()) return placementApiDisabledResponse();

  const user = await getApiUser();
  if (!user) return apiUnauthorized();
  if (!userHasAdsPermission(user, "ads:campaigns:read")) {
    return apiForbidden("Missing ads:campaigns:read");
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = searchSchema.safeParse(json);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const result = await searchPlacementOpportunities(parsed.data);
    return jsonOk(result);
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Search failed", 400);
  }
}
