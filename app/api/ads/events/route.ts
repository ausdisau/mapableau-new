import { ZodError } from "zod";
import { cookies } from "next/headers";

import {
  AD_SESSION_COOKIE,
  getOrCreateAdSessionToken,
} from "@/lib/ads/ad-request-utils";
import { recordAdEvent, recordAdUserAction } from "@/lib/ads/ad-event-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { adEventPayloadSchema, adUserActionSchema } from "@/types/ads";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sessionToken = getOrCreateAdSessionToken(
    cookieStore.get(AD_SESSION_COOKIE)?.value,
  );

  let currentUser: { id: string } | null = null;
  try {
    const user = await requireApiSession();
    if (!(user instanceof Response)) currentUser = user;
  } catch {
    currentUser = null;
  }

  try {
    const body = await request.json();

    if (body.actionType === "hidden" || body.actionType === "reported") {
      const parsed = adUserActionSchema.parse({
        ...body,
        sessionToken,
      });
      await recordAdUserAction({
        campaignId: parsed.campaignId,
        actionType: parsed.actionType,
        sessionToken,
        userId: currentUser?.id,
        reason: parsed.reason,
      });
    } else {
      const parsed = adEventPayloadSchema.parse({
        ...body,
        sessionToken,
      });
      await recordAdEvent({
        campaignId: parsed.campaignId,
        creativeId: parsed.creativeId,
        eventType: parsed.eventType,
        placementSurface: parsed.placementSurface,
        sessionToken,
        userId: currentUser?.id,
        metadata: parsed.metadata,
      });
    }

    const response = jsonOk({ ok: true });
    response.headers.set(
      "Set-Cookie",
      `${AD_SESSION_COOKIE}=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`,
    );
    return response;
  } catch (error) {
    if (error instanceof ZodError) return zodErrorResponse(error);
    return jsonError("Could not record ad event", 500);
  }
}
