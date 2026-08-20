import { z } from "zod";

import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { recordAdClickAndResolveDestination } from "@/lib/ads/services/measurement";

const bodySchema = z.object({
  impressionId: z.string().min(1).max(128),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!checkIpRateLimit(`ads:clicks:${ip}`, { windowMs: 60_000, max: 60 })) {
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

  const result = await recordAdClickAndResolveDestination(parsed.data);
  if (!result.ok) {
    return jsonError(result.reason, 400);
  }

  return jsonOk({
    clickId: result.clickId,
    redirectUrl: result.redirectUrl,
  });
}
