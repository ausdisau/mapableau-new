import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  adsManagerErrorResponse,
  assertAdsManagerEnabled,
} from "@/lib/ads/auth/advertiser-access";
import {
  createOrgCampaign,
  listOrgCampaigns,
  patchOrgCampaign,
} from "@/lib/ads/services/manager-service";

export async function GET() {
  try {
    assertAdsManagerEnabled();
    const user = await requireApiSession();
    if (user instanceof Response) return user;
    const campaigns = await listOrgCampaigns(user);
    return jsonOk({ campaigns });
  } catch (err) {
    return adsManagerErrorResponse(err);
  }
}

const createSchema = z.object({
  advertiserId: z.string().min(1),
  name: z.string().min(1).max(200),
  placementCodes: z.array(z.string()).optional(),
  isHouse: z.boolean().optional(),
  region: z.string().max(64).optional(),
  category: z.string().max(64).optional(),
});

export async function POST(request: Request) {
  try {
    assertAdsManagerEnabled();
    const user = await requireApiSession();
    if (user instanceof Response) return user;

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return jsonError("Invalid JSON", 400);
    }
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const campaign = await createOrgCampaign(user, parsed.data);
    return jsonOk({ campaign }, 201);
  } catch (err) {
    return adsManagerErrorResponse(err);
  }
}
