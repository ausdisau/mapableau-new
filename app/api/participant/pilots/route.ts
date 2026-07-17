import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import { toParticipantSafePilot } from "@/lib/pilot/api/access";
import { prisma } from "@/lib/prisma";

/** GET /api/participant/pilots */
export async function GET() {
  const user = await requireApiPermission("participant:pilot:view");
  if (user instanceof Response) return user;

  const enrolments = await prisma.pilotParticipantEnrolment.findMany({
    where: { participantId: user.id },
    include: { pilot: true },
    orderBy: { updatedAt: "desc" },
  });

  return jsonNdisOk({
    pilots: enrolments.map((e) => toParticipantSafePilot(e.pilot, e)),
  });
}
