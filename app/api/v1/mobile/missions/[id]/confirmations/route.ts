import { confirmMissionActionRequestSchema } from "@mapable/careos-contracts";

import { apiErrorResponse, apiSuccessResponse } from "@/lib/platform/api/errors";
import {
  isMobileAuthContext,
  requireMobileAuth,
} from "@/lib/mobile/auth";
import { mapMissionDetail } from "@/lib/mobile/mission-mapper";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireMobileAuth(req);
  if (!isMobileAuthContext(auth)) return auth;
  if (!auth.participantId) {
    return apiErrorResponse(
      "forbidden",
      "Participant authority required",
      403,
    );
  }

  const { id } = await context.params;
  const json = await req.json().catch(() => null);
  const parsed = confirmMissionActionRequestSchema.safeParse(json);
  if (!parsed.success) {
    return apiErrorResponse("validation_error", "Invalid confirmation", 400);
  }

  const mission = await prisma.careOSMission.findFirst({
    where: { id, participantId: auth.participantId },
  });
  if (!mission) {
    return apiErrorResponse("not_found", "Mission not found", 404);
  }

  const existing = await prisma.careOSActionReceipt.findUnique({
    where: { tokenId: parsed.data.idempotencyKey },
  });

  if (!existing) {
    await prisma.careOSActionReceipt.create({
      data: {
        tokenId: parsed.data.idempotencyKey,
        proposalId: parsed.data.confirmationId,
        requestId: mission.requestId,
        participantId: auth.participantId,
        missionId: mission.id,
        actionType:
          parsed.data.decision === "grant"
            ? `${parsed.data.domain}_confirmed`
            : `${parsed.data.domain}_declined`,
        payloadHash: `${parsed.data.domain}:${parsed.data.decision}`,
        status: "completed",
        completedAt: new Date(),
      },
    });
  }

  const detail = mapMissionDetail(mission);
  const pendingConfirmations = detail.pendingConfirmations.map((c) =>
    c.domain === parsed.data.domain
      ? {
          ...c,
          status:
            parsed.data.decision === "grant"
              ? ("granted" as const)
              : ("declined" as const),
        }
      : c,
  );
  const receipts =
    parsed.data.decision === "grant"
      ? [
          ...detail.receipts,
          {
            id: parsed.data.idempotencyKey,
            domain: parsed.data.domain,
            action: `${parsed.data.domain}_confirmed`,
            confirmedAt: new Date().toISOString(),
            correlationId: parsed.data.idempotencyKey,
          },
        ]
      : detail.receipts;

  return apiSuccessResponse({
    ...detail,
    pendingConfirmations,
    receipts,
  });
}