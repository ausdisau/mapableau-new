import { getServerSession } from "next-auth";
import type { Prisma } from "@prisma/client";

import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { redactPersonalInformation } from "@/lib/ai/privacy";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isAccessChatEnabled } from "@/lib/config/access-chat";
import { prisma } from "@/lib/prisma";
import { accessChatFeedbackSchema } from "@/types/access-chat";

/** Store chat feedback; auth optional. */
export async function POST(req: Request) {
  if (!isAccessChatEnabled()) {
    return jsonError("Access chat is disabled", 503);
  }

  const ip = getClientIp(req);
  if (!checkIpRateLimit(ip, { windowMs: 60_000, max: 40 })) {
    return jsonError("Too many requests. Please wait a moment.", 429);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = accessChatFeedbackSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  const comment = parsed.data.comment
    ? redactPersonalInformation(parsed.data.comment).slice(0, 2000)
    : null;

  const intentSnapshot = parsed.data.intentSnapshot as
    | Prisma.InputJsonValue
    | undefined;

  const row = await prisma.accessChatFeedback.create({
    data: {
      userId,
      sessionId: parsed.data.sessionId,
      messageId: parsed.data.messageId,
      rating: parsed.data.rating,
      comment,
      intentSnapshot,
    },
  });

  return jsonOk({ id: row.id, ok: true });
}
