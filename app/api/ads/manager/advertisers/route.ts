import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  adsManagerErrorResponse,
  assertAdsManagerEnabled,
} from "@/lib/ads/auth/advertiser-access";
import {
  createOrgAdvertiser,
  listOrgAdvertisers,
} from "@/lib/ads/services/manager-service";

export async function GET() {
  try {
    assertAdsManagerEnabled();
    const user = await requireApiSession();
    if (user instanceof Response) return user;
    const advertisers = await listOrgAdvertisers(user);
    return jsonOk({ advertisers });
  } catch (err) {
    return adsManagerErrorResponse(err);
  }
}

const createSchema = z.object({
  name: z.string().min(1).max(200),
  organisationId: z.string().min(1),
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

    const advertiser = await createOrgAdvertiser(user, parsed.data);
    return jsonOk({ advertiser }, 201);
  } catch (err) {
    return adsManagerErrorResponse(err);
  }
}
