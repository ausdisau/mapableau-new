import { prisma } from "@/lib/prisma";
import { auditContinuityEvent } from "@/lib/continuity-os/audit";

/**
 * Stop ContinuityOS workflows for a mission.
 * Must also honour AURA stop when AuraMissionExtension exists (tip merge).
 * Idempotent.
 */
export async function stopContinuityMission(params: {
  missionId: string;
  participantId: string;
  actorUserId: string;
  reason?: string;
}): Promise<{ stopped: true; alreadyStopped: boolean }> {
  const mission = await prisma.careOSMission.findFirst({
    where: {
      id: params.missionId,
      participantId: params.participantId,
    },
    include: { lifeEventExtension: true },
  });

  if (!mission) {
    throw new Error("Mission not found");
  }

  const alreadyStopped =
    mission.status === "stopped" ||
    mission.lifeEventExtension?.continuityStatus === "stopped" ||
    mission.lifeEventExtension?.stoppedAt != null;

  if (alreadyStopped) {
    return { stopped: true, alreadyStopped: true };
  }

  await prisma.$transaction([
    prisma.careOSMission.update({
      where: { id: mission.id },
      data: { status: "stopped", stateVersion: { increment: 1 } },
    }),
    prisma.lifeEventMissionExtension.updateMany({
      where: { missionId: mission.id },
      data: {
        continuityStatus: "stopped",
        stoppedAt: new Date(),
        stopReason: params.reason ?? "participant_stop",
      },
    }),
  ]);

  await auditContinuityEvent({
    action: "continuity.life_event.stopped",
    actorUserId: params.actorUserId,
    participantId: params.participantId,
    entityType: "CareOSMission",
    entityId: mission.id,
    metadata: { reason: params.reason ?? "participant_stop" },
  });

  return { stopped: true, alreadyStopped: false };
}

export async function assertMissionNotStopped(missionId: string): Promise<void> {
  const mission = await prisma.careOSMission.findUnique({
    where: { id: missionId },
    include: { lifeEventExtension: true },
  });
  if (!mission) throw new Error("Mission not found");
  if (
    mission.status === "stopped" ||
    mission.lifeEventExtension?.continuityStatus === "stopped"
  ) {
    throw new Error("Mission stopped — ContinuityOS will not continue");
  }
}
