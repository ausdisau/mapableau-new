import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  isDecisionRoomEnabled,
  isRightsOsEnabled,
} from "@/lib/rights-os/config";
import {
  getDecisionRoom,
  inviteSupporter,
  recordDissent,
  recordParticipantDecision,
} from "@/lib/rights-os/decision-room/decision-room-service";
import { recordDecisionSchema } from "@/lib/validation/rights-os";

type RouteParams = { params: Promise<{ decisionId: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  if (!isRightsOsEnabled() || !isDecisionRoomEnabled()) {
    return jsonError("Decision Room is not enabled", 404);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { decisionId } = await params;
  const room = await getDecisionRoom(decisionId, user.id);
  if (!room) return jsonError("Not found", 404);

  return jsonOk({ room });
}

export async function POST(req: Request, { params }: RouteParams) {
  if (!isRightsOsEnabled() || !isDecisionRoomEnabled()) {
    return jsonError("Decision Room is not enabled", 404);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { decisionId } = await params;

  try {
    const parsed = recordDecisionSchema.parse(await req.json());
    const record = await recordParticipantDecision({
      roomId: decisionId,
      participantWording: parsed.participantWording,
      chosenOptionId: parsed.chosenOptionId,
      reflection: parsed.reflection,
      actorUserId: user.id,
    });
    return jsonOk({ record }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return jsonError("Forbidden", 403);
    }
    return jsonError("Failed to record decision", 500);
  }
}
