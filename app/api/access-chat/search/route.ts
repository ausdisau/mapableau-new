import { z } from "zod";

import { runHybridAccessSearch } from "@/lib/access-chat/hybrid-search";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isAccessChatEnabled } from "@/lib/config/access-chat";
import { accessSearchIntentSchema } from "@/types/access-chat";

const bodySchema = z.object({
  intent: accessSearchIntentSchema,
  limit: z.number().min(1).max(10).optional(),
});

export const maxDuration = 30;

/** Hybrid search from structured intent. */
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
    const outcome = await runHybridAccessSearch(parsed.data.intent, {
      limit: parsed.data.limit,
    });
    return jsonOk(outcome);
  } catch (err) {
    console.error("[access-chat/search]", err);
    return jsonError("Search failed.", 502);
  }
}
