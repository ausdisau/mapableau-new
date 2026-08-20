import { z } from "zod";

import { mapableGoFlags, goFeatureDisabledResponse } from "@/lib/config/mapable-go";
import {
  createLocationSession,
  revokeLocationSession,
} from "@/lib/go/location-session-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";

const createSessionSchema = z.object({
  purpose: z.enum(["current_location", "route_history", "barrier_report"]),
  precision: z.enum(["coarse", "precise"]).optional(),
  consentGranted: z.boolean().optional(),
});

export async function POST(req: Request) {
  if (!mapableGoFlags.enabled) {
    return goFeatureDisabledResponse("MAPABLE_GO_ENABLED");
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const body = await req.json();
  const parsed = createSessionSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const session = await createLocationSession({
    userId: user.id,
    purpose: parsed.data.purpose,
    precision: parsed.data.precision,
    consentGranted: parsed.data.consentGranted,
  });

  return jsonOk(
    {
      sessionId: session.id,
      purpose: session.purpose,
      precision: session.precision,
      expiresAt: session.expiresAt.toISOString(),
    },
    201,
  );
}

export async function DELETE(req: Request) {
  if (!mapableGoFlags.enabled) {
    return goFeatureDisabledResponse("MAPABLE_GO_ENABLED");
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId");
  if (!sessionId) return jsonError("sessionId required", 400);

  const revoked = await revokeLocationSession(sessionId, user.id);
  if (!revoked) return jsonError("Session not found", 404);

  return jsonOk({ revoked: true, sessionId: revoked.id });
}
