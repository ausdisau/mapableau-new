
import { z } from "zod";

import { apiErrorResponse, apiSuccessResponse } from "@/lib/platform/api/errors";
import { mobileAppConfig } from "@/lib/config/mobile-app";
import {
  isMobileAuthContext,
  requireMobileAuth,
} from "@/lib/mobile/auth";

const bodySchema = z.object({
  cursor: z.string().nullable(),
});

export async function POST(req: Request) {
  const auth = await requireMobileAuth(req);
  if (!isMobileAuthContext(auth)) return auth;
  if (!mobileAppConfig.offlineEnabled) {
    return apiErrorResponse("forbidden", "Offline sync disabled", 403);
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return apiErrorResponse("validation_error", "Invalid sync pull", 400);
  }

  return apiSuccessResponse({
    cursor: new Date().toISOString(),
    records: [],
    revocations: [],
  });
}
