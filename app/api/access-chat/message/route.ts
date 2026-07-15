import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { handleAccessChatMessage } from "@/lib/access-chat/message-handler";
import { isAccessChatEnabled } from "@/lib/config/access-chat";
import { accessChatMessageRequestSchema } from "@/types/access-chat";

export const maxDuration = 60;

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;

/** Full Access chat turn: parse → search → rank → synthesize. Anonymous OK. */
export async function POST(req: Request) {
  if (!isAccessChatEnabled()) {
    return jsonError("Access chat is disabled", 503);
  }

  const ip = getClientIp(req);
  if (!checkIpRateLimit(ip, { windowMs: RATE_LIMIT_WINDOW_MS, max: RATE_LIMIT_MAX })) {
    return jsonError("Too many requests. Please wait a moment.", 429);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = accessChatMessageRequestSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const result = await handleAccessChatMessage(parsed.data);
    return jsonOk(result);
  } catch (err) {
    console.error("[access-chat/message]", err);
    return jsonError("Could not process your message.", 502);
  }
}
