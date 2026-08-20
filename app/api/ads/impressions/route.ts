import { z } from "zod";

import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { recordAdImpression } from "@/lib/ads/services/measurement";

const bodySchema = z.object({
  decisionId: z.string().min(1).max(128),
  placementCode: z.string().min(1).max(128),
  provider: z.enum([
    "mapable_internal",
    "google_ad_manager",
    "ethicalads",
  ]),
  campaignId: z.string().max(128).optional(),
  anonymousSessionRef: z.string().max(128).optional(),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkIpRateLimit(`ads:impressions:${ip}`, { windowMs: 60_000, max: 120 })) {
    return jsonError("Rate limit exceeded", 429);
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const result = await recordAdImpression(parsed.data);
  return jsonOk({ impression: result });
}
