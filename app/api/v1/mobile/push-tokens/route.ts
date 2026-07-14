
import { z } from "zod";

import { apiErrorResponse, apiSuccessResponse } from "@/lib/platform/api/errors";
import { mobileAppConfig } from "@/lib/config/mobile-app";
import {
  isMobileAuthContext,
  requireMobileAuth,
} from "@/lib/mobile/auth";
import { registerPushToken } from "@/platform/push";

const bodySchema = z.object({
  token: z.string().min(8),
  platform: z.enum(["ios", "android"]),
  idempotencyKey: z.string().uuid(),
});

export async function POST(req: Request) {
  const auth = await requireMobileAuth(req);
  if (!isMobileAuthContext(auth)) return auth;
  if (!mobileAppConfig.pushEnabled) {
    return apiErrorResponse("forbidden", "Push notifications disabled", 403);
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return apiErrorResponse("validation_error", "Invalid push token payload", 400);
  }

  const result = await registerPushToken({
    userId: auth.userId,
    participantId: auth.participantId,
    ...parsed.data,
  });
  return apiSuccessResponse(result);
}
