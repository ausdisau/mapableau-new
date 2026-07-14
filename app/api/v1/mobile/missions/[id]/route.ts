
import { apiErrorResponse, apiSuccessResponse } from "@/lib/platform/api/errors";
import {
  isMobileAuthContext,
  requireMobileAuth,
} from "@/lib/mobile/auth";
import { mapMissionDetail } from "@/lib/mobile/mission-mapper";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireMobileAuth(req);
  if (!isMobileAuthContext(auth)) return auth;
  const { id } = await context.params;

  const mission = await prisma.careOSMission.findFirst({
    where: {
      id,
      ...(auth.participantId ? { participantId: auth.participantId } : {}),
    },
  });

  if (!mission) {
    return apiErrorResponse("not_found", "Mission not found", 404);
  }

  return apiSuccessResponse(mapMissionDetail(mission));
}
