import { randomUUID } from "crypto";

import { prisma } from "@/lib/prisma";
import { ContinuityOsError } from "@/lib/continuity-os/errors";

export type CareOSMissionStatus =
  | "draft"
  | "planning"
  | "awaiting_participant_input"
  | "awaiting_external_information"
  | "ready"
  | "in_progress"
  | "disrupted"
  | "recovery_required"
  | "recovering"
  | "partially_recovered"
  | "paused"
  | "completed"
  | "cancelled"
  | "stopped"
  | "human_review_required";

export async function createCareOSMission(params: {
  participantId: string;
  missionType: string;
  desiredOutcome: string;
  tenantId?: string;
  inputSummary?: Record<string, unknown>;
  graphJson?: Record<string, unknown>;
  modulesJson?: unknown[];
  status?: CareOSMissionStatus;
}) {
  return prisma.careOSMission.create({
    data: {
      participantId: params.participantId,
      tenantId: params.tenantId,
      requestId: `continuity-${randomUUID()}`,
      missionType: params.missionType,
      desiredOutcome: params.desiredOutcome,
      status: params.status ?? "draft",
      inputSummary: params.inputSummary ?? {},
      graphJson: params.graphJson ?? { nodes: [], edges: [] },
      modulesJson: params.modulesJson ?? ["continuity-os"],
      correlationId: randomUUID(),
    },
  });
}

export async function getCareOSMissionForParticipant(
  missionId: string,
  participantId: string
) {
  const mission = await prisma.careOSMission.findFirst({
    where: { id: missionId, participantId },
    include: {
      lifeEventExtension: true,
      milestones: { orderBy: { sortOrder: "asc" } },
      dependencySnapshots: { orderBy: { version: "desc" }, take: 1 },
    },
  });
  if (!mission) {
    throw new ContinuityOsError("NOT_FOUND", "Life-event mission not found.", 404);
  }
  return mission;
}

export async function assertMissionNotStopped(missionId: string): Promise<void> {
  const mission = await prisma.careOSMission.findUnique({
    where: { id: missionId },
    select: { stopState: true, status: true },
  });
  if (!mission) {
    throw new ContinuityOsError("NOT_FOUND", "Mission not found.", 404);
  }
  if (mission.stopState || mission.status === "stopped") {
    throw new ContinuityOsError(
      "MISSION_STOPPED",
      "This ContinuityOS workflow was stopped by the participant.",
      409
    );
  }
}

export async function stopCareOSMission(params: {
  missionId: string;
  participantId: string;
  reason?: string;
}) {
  const mission = await getCareOSMissionForParticipant(
    params.missionId,
    params.participantId
  );

  const updated = await prisma.careOSMission.update({
    where: { id: mission.id },
    data: {
      stopState: true,
      status: "stopped",
      stateVersion: { increment: 1 },
    },
  });

  await prisma.careOSMissionEvent.create({
    data: {
      missionId: mission.id,
      participantId: params.participantId,
      eventType: "life_event.stopped",
      sourceModule: "continuity-os",
      severity: "attention",
      summary: "Participant stopped ContinuityOS for this mission.",
      payloadJson: { reason: params.reason ?? null },
      eventKey: `stop-${Date.now()}`,
    },
  });

  await prisma.recoveryCase.updateMany({
    where: { missionId: mission.id, status: { in: ["open", "recovering"] } },
    data: { stopState: true, status: "cancelled_by_participant" },
  });

  return updated;
}

export async function appendMissionEvent(params: {
  missionId: string;
  participantId: string;
  eventType: string;
  summary: string;
  severity?: string;
  payloadJson?: Record<string, unknown>;
  sourceEntityId?: string;
  eventKey?: string;
}) {
  return prisma.careOSMissionEvent.create({
    data: {
      missionId: params.missionId,
      participantId: params.participantId,
      eventType: params.eventType,
      sourceModule: "continuity-os",
      sourceEntityId: params.sourceEntityId,
      severity: params.severity ?? "information",
      summary: params.summary,
      payloadJson: params.payloadJson,
      eventKey: params.eventKey ?? `${params.eventType}-${randomUUID()}`,
    },
  });
}
