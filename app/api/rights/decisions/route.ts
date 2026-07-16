import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  isDecisionRoomEnabled,
  isRightsOsEnabled,
} from "@/lib/rights-os/config";
import {
  createDecisionRoom,
  getDecisionRoom,
  recordParticipantDecision,
} from "@/lib/rights-os/decision-room/decision-room-service";
import { createDecisionRoomSchema } from "@/lib/validation/rights-os";

export async function GET() {
  if (!isRightsOsEnabled() || !isDecisionRoomEnabled()) {
    return jsonError("Decision Room is not enabled", 404);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { prisma } = await import("@/lib/prisma");
  const rooms = await prisma.decisionRoom.findMany({
    where: { subjectUserId: user.id },
    orderBy: { createdAt: "desc" },
    include: { options: true },
  });

  return jsonOk({ rooms });
}

export async function POST(req: Request) {
  if (!isRightsOsEnabled() || !isDecisionRoomEnabled()) {
    return jsonError("Decision Room is not enabled", 404);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const parsed = createDecisionRoomSchema.parse(await req.json());
    const room = await createDecisionRoom({
      subjectUserId: user.id,
      title: parsed.title,
      question: parsed.question,
      values: parsed.values,
      constraints: parsed.constraints,
      options: parsed.options,
    });
    return jsonOk({ room }, 201);
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    return jsonError("Failed to create decision room", 500);
  }
}
