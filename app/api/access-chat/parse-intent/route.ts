import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { parseAccessIntent } from "@/lib/access-chat/parse-intent";
import { isAccessChatEnabled } from "@/lib/config/access-chat";
import { z } from "zod";

import { userContextSchema } from "@/types/access-chat";

const bodySchema = z.object({
  message: z.string().min(1).max(2000),
  shareAccessProfile: z.boolean().optional(),
  userContext: userContextSchema.optional(),
  locationHint: z
    .object({
      lat: z.number().optional(),
      lng: z.number().optional(),
      suburb: z.string().optional(),
    })
    .optional(),
});

export const maxDuration = 30;

/** Parse natural language into AccessSearchIntent. */
export async function POST(req: Request) {
  if (!isAccessChatEnabled()) {
    return jsonError("Access chat is disabled", 503);
  }

  const ip = getClientIp(req);
  if (!checkIpRateLimit(ip, { windowMs: 60_000, max: 30 })) {
    return jsonError("Too many requests. Please wait a moment.", 429);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const result = await parseAccessIntent(parsed.data.message, {
      locationHint: parsed.data.locationHint,
      userContext: parsed.data.userContext,
      shareAccessProfile: parsed.data.shareAccessProfile,
    });
    return jsonOk(result);
  } catch (err) {
    console.error("[access-chat/parse-intent]", err);
    return jsonError("Could not parse intent.", 502);
  }
}
