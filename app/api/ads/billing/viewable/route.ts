import { z } from "zod";

import { billViewableImpression } from "@/lib/ads/billing/charge-events";
import { adsFlagsConfig } from "@/lib/ads/config/flags";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";

const bodySchema = z.object({
  impressionId: z.string().min(1),
  /** Client reports viewability criteria met; never submits charge amount. */
  viewable: z.literal(true),
});

/**
 * POST /api/ads/billing/viewable
 * Records a viewable impression bill for CPM campaigns.
 */
export async function POST(request: Request) {
  if (!adsFlagsConfig.isBillingEnabled()) {
    return jsonError("Ads billing disabled", 403);
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const result = await billViewableImpression({
    impressionId: parsed.data.impressionId,
  });

  if (!result.ok) {
    return jsonOk({ billed: false, reason: result.reason });
  }

  return jsonOk({
    billed: true,
    chargedMicros: result.chargedMicros,
    duplicate: result.duplicate,
  });
}
