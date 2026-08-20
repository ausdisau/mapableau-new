import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  adsManagerErrorResponse,
  assertAdsManagerEnabled,
} from "@/lib/ads/auth/advertiser-access";
import {
  createOrgCreative,
  listOrgCreatives,
} from "@/lib/ads/services/manager-service";

export async function GET() {
  try {
    assertAdsManagerEnabled();
    const user = await requireApiSession();
    if (user instanceof Response) return user;
    const creatives = await listOrgCreatives(user);
    return jsonOk({ creatives });
  } catch (err) {
    return adsManagerErrorResponse(err);
  }
}

const createSchema = z.object({
  campaignId: z.string().min(1),
  format: z.string().min(1).max(64),
  headline: z.string().min(1).max(200),
  body: z.string().min(1).max(2000),
  destinationUrl: z.string().url(),
  imageUrl: z.string().url().optional(),
  altText: z.string().max(500).optional(),
  businessName: z.string().max(200).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
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

    try {
      const creative = await createOrgCreative(user, parsed.data);
      return jsonOk({ creative }, 201);
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("INVALID_DESTINATION:")) {
        return jsonError(e.message.replace("INVALID_DESTINATION:", "Invalid destination: "), 400);
      }
      if (e instanceof Error && e.message === "NOT_FOUND") {
        return jsonError("Campaign not found", 404);
      }
      throw e;
    }
  } catch (err) {
    return adsManagerErrorResponse(err);
  }
}
