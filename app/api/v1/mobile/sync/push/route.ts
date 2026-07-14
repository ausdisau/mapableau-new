
import { z } from "zod";

import { apiErrorResponse, apiSuccessResponse } from "@/lib/platform/api/errors";
import { mobileAppConfig } from "@/lib/config/mobile-app";
import {
  isMobileAuthContext,
  requireMobileAuth,
} from "@/lib/mobile/auth";

const bodySchema = z.object({
  mutations: z.array(
    z.object({
      id: z.string(),
      idempotencyKey: z.string(),
      type: z.string(),
      payload: z.record(z.string(), z.unknown()),
    }),
  ),
});

export async function POST(req: Request) {
  const auth = await requireMobileAuth(req);
  if (!isMobileAuthContext(auth)) return auth;
  if (!mobileAppConfig.offlineEnabled) {
    return apiErrorResponse("forbidden", "Offline sync disabled", 403);
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return apiErrorResponse("validation_error", "Invalid sync push", 400);
  }

  // Server must revalidate every consequential offline mutation before execution.
  return apiSuccessResponse({
    accepted: parsed.data.mutations.length,
    conflicts: [],
  });
}
