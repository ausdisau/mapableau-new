import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  ContinuityOsError,
} from "@/lib/continuity-os/errors";
import {
  isDependencyGraphEnabled,
  isLifeEventsEnabled,
  getContinuityOsFlags,
} from "@/lib/continuity-os/feature-flags";
import { projectDependenciesFromTemplate } from "@/lib/continuity-os/dependencies/projection";
import {
  appendMissionEvent,
  createCareOSMission,
  getCareOSMissionForParticipant,
  stopCareOSMission,
} from "@/lib/continuity-os/missions/careos-mission-adapter";
import { requireLifeEventType } from "@/lib/continuity-os/taxonomy/registry";
import type { LifeEventTypeCode } from "@/lib/continuity-os/taxonomy/types";
import { prisma } from "@/lib/prisma";

export interface CreateLifeEventInput {
  participantId: string;
  actorUserId: string;
  lifeEventTypeCode: LifeEventTypeCode | string;
  participantGoal: string;
  participantWording?: string;
  desiredTiming?: Date;
  eventHorizon?: string;
  selectedPassportId?: string;
  privacyMode?: string;
  knownCommitments?: string[];
  unknowns?: string[];
  blockers?: string[];
  nonNegotiableRequirements?: string[];
  preferredSupport?: string[];
  humanHelpRequested?: boolean;
  safetyConcern?: boolean;
  activate?: boolean;
}

async function ensureTypeVersion(code: string) {
  const definition = requireLifeEventType(code);
  let type = await prisma.lifeEventType.findUnique({ where: { code } });
  if (!type) {
    type = await prisma.lifeEventType.create({
      data: {
        code: definition.code,
        category: definition.category,
        title: definition.title,
      },
    });
  }
  let version = await prisma.lifeEventTypeVersion.findFirst({
    where: { lifeEventTypeId: type.id, version: definition.version },
  });
  if (!version) {
    version = await prisma.lifeEventTypeVersion.create({
      data: {
        lifeEventTypeId: type.id,
        version: definition.version,
        definitionJson: definition as object,
        reviewOwner: definition.reviewOwner,
        policySourceKeys: definition.policySourceKeys,
      },
    });
  }
  return { definition, version };
}

export async function createLifeEventMission(input: CreateLifeEventInput) {
  if (!isLifeEventsEnabled()) {
    throw new ContinuityOsError(
      "LIFE_EVENTS_DISABLED",
      "Life events are disabled.",
      503
    );
  }
  if (!input.participantGoal.trim()) {
    throw new ContinuityOsError(
      "VALIDATION_FAILED",
      "Participant goal is required.",
      400
    );
  }
  if (input.actorUserId !== input.participantId) {
    throw new ContinuityOsError(
      "FORBIDDEN",
      "Only the participant or valid authority may create this life event.",
      403
    );
  }

  const { definition, version } = await ensureTypeVersion(input.lifeEventTypeCode);
  const activate = Boolean(input.activate);
  const currentState = activate ? "planning" : "draft";

  const projection = projectDependenciesFromTemplate({
    definition,
    participantGoal: input.participantGoal,
    knownCommitments: input.knownCommitments,
    unknowns: input.unknowns,
    blockers: input.blockers,
  });

  const mission = await createCareOSMission({
    participantId: input.participantId,
    missionType: `life_event:${definition.code}`,
    desiredOutcome: input.participantGoal,
    status: currentState,
    inputSummary: {
      lifeEventTypeCode: definition.code,
      lifeEventVersion: definition.version,
      participantWording: input.participantWording ?? input.participantGoal,
      knownCommitments: input.knownCommitments ?? [],
      mode: getContinuityOsFlags().mode,
    },
    graphJson: {
      nodes: projection.nodes,
      edges: projection.edges,
    },
    modulesJson: ["continuity-os", ...definition.likelyDomains],
  });

  const extension = await prisma.lifeEventMissionExtension.create({
    data: {
      missionId: mission.id,
      participantId: input.participantId,
      lifeEventTypeVersionId: version.id,
      lifeEventTypeCode: definition.code,
      participantGoal: input.participantGoal,
      participantWording: input.participantWording ?? input.participantGoal,
      currentState,
      selectedPassportId: input.selectedPassportId,
      privacyMode: input.privacyMode ?? "standard",
      desiredTiming: input.desiredTiming,
      eventHorizon: input.eventHorizon ?? "medium_term",
      unknownsJson: projection.unknowns,
      blockersJson: projection.blockers,
      nonNegotiableJson: input.nonNegotiableRequirements ?? [],
      preferredSupportJson: input.preferredSupport ?? [],
      humanHelpRequested: input.humanHelpRequested ?? false,
      safetyConcern: input.safetyConcern ?? false,
      activatedAt: activate ? new Date() : null,
    },
  });

  if (getContinuityOsFlags().lifeEventTemplatesEnabled) {
    await prisma.lifeEventMilestone.createMany({
      data: definition.milestones.map((m, index) => ({
        missionId: mission.id,
        code: m.code,
        label: m.label,
        status: "pending",
        ownerRole: m.defaultOwnerRole,
        sortOrder: index,
      })),
    });
  }

  if (isDependencyGraphEnabled()) {
    await prisma.continuityDependencySnapshot.create({
      data: {
        missionId: mission.id,
        version: 1,
        nodesJson: projection.nodes,
        edgesJson: projection.edges,
        responsibilitiesJson: projection.responsibilities,
        unknownsJson: projection.unknowns,
        blockersJson: projection.blockers,
      },
    });
  }

  await appendMissionEvent({
    missionId: mission.id,
    participantId: input.participantId,
    eventType: activate ? "life_event.activated" : "life_event.created",
    summary: activate
      ? `Life event ${definition.code} activated.`
      : `Life event ${definition.code} drafted.`,
    payloadJson: {
      lifeEventTypeCode: definition.code,
      version: definition.version,
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    action: activate ? "continuity.life_event.activated" : "continuity.life_event.created",
    entityType: "CareOSMission",
    entityId: mission.id,
    participantId: input.participantId,
    metadata: {
      lifeEventTypeCode: definition.code,
      mode: getContinuityOsFlags().mode,
    },
  });

  return {
    mission,
    extension,
    definition,
    projection: isDependencyGraphEnabled() ? projection : null,
  };
}

export async function getLifeEventMission(
  missionId: string,
  participantId: string
) {
  if (!isLifeEventsEnabled()) {
    throw new ContinuityOsError(
      "LIFE_EVENTS_DISABLED",
      "Life events are disabled.",
      503
    );
  }
  const mission = await getCareOSMissionForParticipant(missionId, participantId);
  if (!mission.lifeEventExtension) {
    throw new ContinuityOsError(
      "NOT_FOUND",
      "Life-event extension not found for mission.",
      404
    );
  }
  const definition = requireLifeEventType(mission.lifeEventExtension.lifeEventTypeCode);
  const snapshot = mission.dependencySnapshots[0] ?? null;
  return { mission, extension: mission.lifeEventExtension, definition, snapshot };
}

export async function updateLifeEventMission(params: {
  missionId: string;
  participantId: string;
  actorUserId: string;
  patch: {
    participantGoal?: string;
    participantWording?: string;
    currentState?: string;
    unknowns?: string[];
    blockers?: string[];
    desiredTiming?: Date | null;
    humanHelpRequested?: boolean;
  };
}) {
  if (!isLifeEventsEnabled()) {
    throw new ContinuityOsError(
      "LIFE_EVENTS_DISABLED",
      "Life events are disabled.",
      503
    );
  }
  const { mission, extension } = await getLifeEventMission(
    params.missionId,
    params.participantId
  );
  if (mission.stopState) {
    throw new ContinuityOsError("MISSION_STOPPED", "Mission is stopped.", 409);
  }
  if (params.actorUserId !== params.participantId) {
    throw new ContinuityOsError("FORBIDDEN", "Not authorised.", 403);
  }

  const updatedExtension = await prisma.lifeEventMissionExtension.update({
    where: { id: extension.id },
    data: {
      participantGoal: params.patch.participantGoal ?? extension.participantGoal,
      participantWording:
        params.patch.participantWording ?? extension.participantWording,
      currentState: params.patch.currentState ?? extension.currentState,
      unknownsJson: params.patch.unknowns ?? extension.unknownsJson,
      blockersJson: params.patch.blockers ?? extension.blockersJson,
      desiredTiming:
        params.patch.desiredTiming === undefined
          ? extension.desiredTiming
          : params.patch.desiredTiming,
      humanHelpRequested:
        params.patch.humanHelpRequested ?? extension.humanHelpRequested,
    },
  });

  if (params.patch.participantGoal) {
    await prisma.careOSMission.update({
      where: { id: mission.id },
      data: {
        desiredOutcome: params.patch.participantGoal,
        stateVersion: { increment: 1 },
      },
    });
  }

  await appendMissionEvent({
    missionId: mission.id,
    participantId: params.participantId,
    eventType: "life_event.updated",
    summary: "Life event mission updated by participant.",
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "continuity.life_event.updated",
    entityType: "LifeEventMissionExtension",
    entityId: updatedExtension.id,
    participantId: params.participantId,
  });

  return updatedExtension;
}

export async function stopLifeEventMission(params: {
  missionId: string;
  participantId: string;
  actorUserId: string;
  reason?: string;
}) {
  if (!isLifeEventsEnabled()) {
    throw new ContinuityOsError(
      "LIFE_EVENTS_DISABLED",
      "Life events are disabled.",
      503
    );
  }
  if (params.actorUserId !== params.participantId) {
    throw new ContinuityOsError("FORBIDDEN", "Not authorised.", 403);
  }
  const mission = await stopCareOSMission(params);
  await prisma.lifeEventMissionExtension.updateMany({
    where: { missionId: params.missionId },
    data: { currentState: "stopped" },
  });
  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "continuity.life_event.stopped",
    entityType: "CareOSMission",
    entityId: mission.id,
    participantId: params.participantId,
    metadata: { reason: params.reason ?? null },
  });
  return mission;
}

export async function listParticipantLifeEvents(participantId: string) {
  if (!isLifeEventsEnabled()) {
    throw new ContinuityOsError(
      "LIFE_EVENTS_DISABLED",
      "Life events are disabled.",
      503
    );
  }
  return prisma.careOSMission.findMany({
    where: {
      participantId,
      missionType: { startsWith: "life_event:" },
    },
    include: { lifeEventExtension: true },
    orderBy: { createdAt: "desc" },
  });
}
