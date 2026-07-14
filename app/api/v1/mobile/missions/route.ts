import { createAppointmentMissionRequestSchema } from "@mapable/careos-contracts";

import { apiErrorResponse, apiSuccessResponse } from "@/lib/platform/api/errors";
import {
  isMobileAuthContext,
  requireMobileAuth,
} from "@/lib/mobile/auth";
import { mapMissionDetail, mapMissionSummary } from "@/lib/mobile/mission-mapper";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const auth = await requireMobileAuth(req);
  if (!isMobileAuthContext(auth)) return auth;
  if (!auth.participantId) {
    return apiErrorResponse(
      "forbidden",
      "Participant context required",
      403,
    );
  }

  const missions = await prisma.careOSMission.findMany({
    where: { participantId: auth.participantId },
    take: 50,
    orderBy: { updatedAt: "desc" },
  });

  return apiSuccessResponse({
    missions: missions.map(mapMissionSummary),
  });
}

export async function POST(req: Request) {
  const auth = await requireMobileAuth(req);
  if (!isMobileAuthContext(auth)) return auth;
  if (!auth.participantId) {
    return apiErrorResponse(
      "forbidden",
      "Participant context required",
      403,
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = createAppointmentMissionRequestSchema.safeParse(json);
  if (!parsed.success) {
    return apiErrorResponse("validation_error", "Invalid mission request", 400);
  }

  const existing = await prisma.careOSMission.findUnique({
    where: { requestId: parsed.data.idempotencyKey },
  });
  if (existing) {
    return apiSuccessResponse(mapMissionDetail(existing));
  }

  const created = await prisma.careOSMission.create({
    data: {
      participantId: auth.participantId,
      missionType: "appointment",
      status: "proposed",
      desiredOutcome: parsed.data.goalText,
      correlationId: parsed.data.idempotencyKey,
      requestId: parsed.data.idempotencyKey,
    },
  });

  return apiSuccessResponse(mapMissionDetail(created));
}
