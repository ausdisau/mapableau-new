import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonNdisError, jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import { toParticipantSafePilot } from "@/lib/pilot/api/access";
import { buildPilotInformationPack } from "@/lib/pilot/enrolment/participant-information-service";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ pilotId: string }> };

/** GET /api/participant/pilots/[pilotId] — participant-safe info only */
export async function GET(_req: Request, { params }: Params) {
  const user = await requireApiPermission("participant:pilot:view");
  if (user instanceof Response) return user;

  const { pilotId } = await params;
  const enrolment = await prisma.pilotParticipantEnrolment.findUnique({
    where: {
      pilotId_participantId: { pilotId, participantId: user.id },
    },
    include: { pilot: true },
  });
  if (!enrolment) return jsonNdisError("Pilot not found", 404);

  const pack = buildPilotInformationPack({
    pilotName: enrolment.pilot.name,
    stage: enrolment.pilot.stage,
    supportItemAllowlist: enrolment.pilot.supportItemAllowlist,
    summary: enrolment.pilot.summary,
  });

  return jsonNdisOk({
    pilot: toParticipantSafePilot(enrolment.pilot, enrolment),
    information: pack,
  });
}
