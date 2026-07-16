import { randomUUID } from "crypto";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { auditContinuityEvent } from "@/lib/continuity-os/audit";
import {
  isDependencyGraphEnabled,
  isLifeEventsEnabled,
  isResilienceEnabled,
} from "@/lib/continuity-os/config";
import { projectLifeEventDependencies } from "@/lib/continuity-os/dependency-projection";
import { buildMilestoneViews } from "@/lib/continuity-os/milestone-engine";
import { assessResilience } from "@/lib/continuity-os/resilience";
import { assertSupportedLifeEventType } from "@/lib/continuity-os/taxonomy";
import type {
  ContinuityPreferenceSet,
  ContinuityMissionStatus,
} from "@/lib/continuity-os/types";

function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export class ContinuityFeatureDisabledError extends Error {
  constructor(message = "ContinuityOS life events are disabled") {
    super(message);
    this.name = "ContinuityFeatureDisabledError";
  }
}

export async function createLifeEventMission(params: {
  participantId: string;
  actorUserId: string;
  typeKey: string;
  participantGoal: string;
  participantWording?: string;
  desiredDate?: Date | null;
  organisationId?: string | null;
  preferences?: ContinuityPreferenceSet;
  preservedUnknowns?: string[];
  nonNegotiableRequirements?: string[];
  privacyMode?: string;
}): Promise<{
  missionId: string;
  extensionId: string;
  typeKey: string;
  typeVersion: string;
  status: ContinuityMissionStatus;
}> {
  if (!isLifeEventsEnabled()) {
    throw new ContinuityFeatureDisabledError();
  }

  const def = assertSupportedLifeEventType(params.typeKey);
  const requestId = `life-event-${randomUUID()}`;

  const graphJson = {
    nodes: def.dependencies.map((d) => ({
      id: d.key,
      type: d.nodeType,
      label: d.label,
      status: d.required ? "needs_review" : "missing",
    })),
    edges: [],
    source: "continuity_os_life_event_template",
  };

  const mission = await prisma.careOSMission.create({
    data: {
      participantId: params.participantId,
      tenantId: params.organisationId ?? null,
      requestId,
      missionType: "life_event",
      desiredOutcome: params.participantGoal,
      status: "draft",
      inputSummary: asJson({
        typeKey: def.typeKey,
        participantWording: params.participantWording ?? params.participantGoal,
        privacyMode: params.privacyMode ?? "standard",
      }),
      graphJson: asJson(graphJson),
      modulesJson: asJson(def.domainsInvolved),
      alertsJson: asJson([]),
      proposalsJson: asJson([]),
      lifeEventExtension: {
        create: {
          typeKey: def.typeKey,
          typeVersion: def.version,
          participantGoal: params.participantGoal,
          participantWording:
            params.participantWording ?? params.participantGoal,
          desiredDate: params.desiredDate ?? null,
          continuityStatus: "draft",
          preferencesJson: asJson(params.preferences ?? {}),
          unknownsJson: asJson(
            params.preservedUnknowns ?? ["reception_assistance"]
          ),
          blockersJson: asJson([]),
          nonNegotiableRequirementsJson: asJson(
            params.nonNegotiableRequirements ?? []
          ),
          privacyMode: params.privacyMode ?? "standard",
          templateWarningsJson: asJson(def.requiredWarnings),
          prohibitedAutomatedDecisionsJson: asJson(
            def.prohibitedAutomatedDecisions
          ),
        },
      },
      events: {
        create: {
          participantId: params.participantId,
          eventType: "life_event.created",
          sourceModule: "continuity-os",
          severity: "information",
          summary: `Life event ${def.typeKey} created in draft`,
          eventKey: `life_event.created:${requestId}`,
          payloadJson: asJson({
            typeKey: def.typeKey,
            typeVersion: def.version,
          }),
        },
      },
    },
    include: { lifeEventExtension: true },
  });

  const extension = mission.lifeEventExtension;
  if (!extension) {
    throw new Error("Life event extension was not created");
  }

  await auditContinuityEvent({
    action: "continuity.life_event.created",
    actorUserId: params.actorUserId,
    participantId: params.participantId,
    entityType: "CareOSMission",
    entityId: mission.id,
    organisationId: params.organisationId,
    metadata: { typeKey: def.typeKey, typeVersion: def.version },
  });

  return {
    missionId: mission.id,
    extensionId: extension.id,
    typeKey: def.typeKey,
    typeVersion: def.version,
    status: "draft",
  };
}

export async function getLifeEventMissionForParticipant(params: {
  missionId: string;
  participantId: string;
}) {
  if (!isLifeEventsEnabled()) {
    throw new ContinuityFeatureDisabledError();
  }

  const mission = await prisma.careOSMission.findFirst({
    where: {
      id: params.missionId,
      participantId: params.participantId,
      missionType: "life_event",
    },
    include: {
      lifeEventExtension: true,
      events: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });

  return mission;
}

export async function getDependencyProjectionForMission(params: {
  missionId: string;
  participantId: string;
}) {
  if (!isDependencyGraphEnabled()) {
    throw new ContinuityFeatureDisabledError(
      "ContinuityOS dependency graph is disabled"
    );
  }

  const mission = await getLifeEventMissionForParticipant(params);
  if (!mission?.lifeEventExtension) {
    throw new Error("Life event mission not found");
  }

  const ext = mission.lifeEventExtension;
  const unknowns = (ext.unknownsJson as string[]) ?? [];
  const hard = (ext.nonNegotiableRequirementsJson as string[]) ?? [];

  const projection = projectLifeEventDependencies({
    typeKey: ext.typeKey,
    typeVersion: ext.typeVersion,
    preservedUnknowns: unknowns,
    hardRequirementKeys: hard,
    careOsGraphJson: mission.graphJson as {
      nodes?: Array<{ id: string; status?: string; label?: string }>;
      edges?: Array<{
        id?: string;
        from?: string;
        to?: string;
        relationship?: string;
      }>;
    },
  });

  const milestones = buildMilestoneViews({
    typeKey: ext.typeKey,
    typeVersion: ext.typeVersion,
    projection,
  });

  return {
    missionId: mission.id,
    participantGoal: ext.participantGoal,
    participantWording: ext.participantWording,
    continuityStatus: ext.continuityStatus,
    projection,
    milestones,
    templateWarnings: (ext.templateWarningsJson as string[]) ?? [],
    prohibitedAutomatedDecisions:
      (ext.prohibitedAutomatedDecisionsJson as string[]) ?? [],
  };
}

export async function runResilienceForMission(params: {
  missionId: string;
  participantId: string;
  actorUserId: string;
}) {
  if (!isResilienceEnabled()) {
    throw new ContinuityFeatureDisabledError(
      "ContinuityOS resilience planning is disabled"
    );
  }

  const dep = await getDependencyProjectionForMission(params);
  const mission = await getLifeEventMissionForParticipant(params);
  const prefs = (mission?.lifeEventExtension?.preferencesJson ??
    {}) as ContinuityPreferenceSet;

  const assessment = assessResilience({
    typeKey: dep.projection.missionTypeKey,
    typeVersion: dep.projection.typeVersion,
    projection: dep.projection,
    preferences: prefs,
  });

  await prisma.continuityAssessment.create({
    data: {
      missionId: params.missionId,
      participantId: params.participantId,
      assessmentType: "pre_mortem",
      findingsJson: asJson(assessment),
      singlePointsOfFailureJson: asJson(assessment.singlePointsOfFailure),
    },
  });

  await auditContinuityEvent({
    action: "continuity.resilience.assessed",
    actorUserId: params.actorUserId,
    participantId: params.participantId,
    entityType: "CareOSMission",
    entityId: params.missionId,
    metadata: {
      findingCount: assessment.findings.length,
      participantScore: null,
    },
  });

  return assessment;
}

export async function listLifeEventMissionsForParticipant(
  participantId: string
) {
  if (!isLifeEventsEnabled()) {
    throw new ContinuityFeatureDisabledError();
  }

  return prisma.careOSMission.findMany({
    where: { participantId, missionType: "life_event" },
    include: { lifeEventExtension: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
