import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { id: participantId } = await params;

  const link = await prisma.supportCoordinatorRelationship.findFirst({
    where: {
      coordinatorId: user.id,
      participantId,
      status: "active",
    },
  });

  await createAuditEvent({
    actorUserId: user.id,
    actorRole: user.primaryRole,
    action: "profile.viewed",
    entityType: "participant",
    entityId: participantId,
    participantId,
    metadata: { consentGranted: Boolean(link) },
  });

  if (!link) {
    return jsonOk({
      consentGranted: false,
      message:
        "This participant has not granted consent. You cannot view their details.",
      participant: null,
    });
  }

  const profile = await prisma.participantProfile.findUnique({
    where: { userId: participantId },
    select: {
      displayName: true,
      preferredName: true,
      homeSuburb: true,
      homeState: true,
    },
  });

  return jsonOk({ consentGranted: true, participant: profile });
}
