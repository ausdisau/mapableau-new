import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  adsManagerErrorResponse,
  assertAdsManagerEnabled,
} from "@/lib/ads/auth/advertiser-access";
import { patchOrgCampaign } from "@/lib/ads/services/manager-service";

type RouteContext = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  placementCodes: z.array(z.string()).optional(),
  status: z
    .enum(["DRAFT", "PENDING_REVIEW", "PAUSED", "ENDED", "REJECTED", "DISABLED"])
    .optional(),
});

export async function PATCH(request: Request, context: RouteContext) {
  try {
    assertAdsManagerEnabled();
    const user = await requireApiSession();
    if (user instanceof Response) return user;

    const { id } = await context.params;
    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return jsonError("Invalid JSON", 400);
    }
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    // Explicitly reject APPROVED/ACTIVE even if somehow passed
    if (
      (json as { status?: string })?.status === "APPROVED" ||
      (json as { status?: string })?.status === "ACTIVE"
    ) {
      return jsonError("Advertisers cannot set APPROVED or ACTIVE status", 403);
    }

    const campaign = await patchOrgCampaign(user, id, parsed.data);
    return jsonOk({ campaign });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return jsonError("Not found", 404);
    }
    return adsManagerErrorResponse(err);
  }
}
