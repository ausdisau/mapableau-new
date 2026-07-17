import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import { loadPilotScoped } from "@/lib/pilot/api/access";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ pilotId: string }> };

/** GET /api/admin/pilots/[pilotId]/participants */
export async function GET(_req: Request, { params }: Params) {
  const user = await requireApiPermission("pilot:view");
  if (user instanceof Response) return user;

  const { pilotId } = await params;
  const pilot = await loadPilotScoped(user, pilotId);
  if (pilot instanceof Response) return pilot;

  const enrolments = await prisma.pilotParticipantEnrolment.findMany({
    where: { pilotId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      participantId: true,
      status: true,
      informationProvidedAt: true,
      pilotConsentAt: true,
      withdrawnAt: true,
      exitedAt: true,
      exitReason: true,
      invitedById: true,
      createdAt: true,
      updatedAt: true,
      participant: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return jsonNdisOk({
    pilotId,
    participants: enrolments.map((e) => ({
      id: e.id,
      participantId: e.participantId,
      displayName: e.participant.name,
      email: e.participant.email,
      status: e.status,
      informationProvidedAt: e.informationProvidedAt?.toISOString() ?? null,
      pilotConsentAt: e.pilotConsentAt?.toISOString() ?? null,
      withdrawnAt: e.withdrawnAt?.toISOString() ?? null,
      exitedAt: e.exitedAt?.toISOString() ?? null,
      exitReason: e.exitReason,
      invitedById: e.invitedById,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    })),
  });
}
