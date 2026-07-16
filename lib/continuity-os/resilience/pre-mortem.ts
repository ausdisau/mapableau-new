import { ContinuityOsError } from "@/lib/continuity-os/errors";
import { isResilienceEnabled } from "@/lib/continuity-os/feature-flags";
import { projectDependenciesFromTemplate } from "@/lib/continuity-os/dependencies/projection";
import { getLifeEventMission } from "@/lib/continuity-os/missions/life-event-service";
import { appendMissionEvent } from "@/lib/continuity-os/missions/careos-mission-adapter";
import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/audit/audit-event-service";

export type ResilienceLevel =
  | "high"
  | "moderate"
  | "low"
  | "no_verified_fallback";

/**
 * Environment / service resilience only — never participant capability.
 */
export function assessResilienceLevel(params: {
  singlePointsOfFailure: string[];
  unconfirmedRequired: number;
  verifiedFallbacks: number;
}): ResilienceLevel {
  if (
    params.singlePointsOfFailure.length > 0 &&
    params.verifiedFallbacks === 0
  ) {
    return "no_verified_fallback";
  }
  if (params.singlePointsOfFailure.length >= 2 || params.unconfirmedRequired >= 3) {
    return "low";
  }
  if (params.singlePointsOfFailure.length === 1 || params.unconfirmedRequired >= 1) {
    return "moderate";
  }
  return "high";
}

export async function runPreMortemAssessment(params: {
  missionId: string;
  participantId: string;
  actorUserId: string;
}) {
  if (!isResilienceEnabled()) {
    throw new ContinuityOsError(
      "RESILIENCE_DISABLED",
      "Resilience planning is disabled.",
      503
    );
  }

  const { mission, extension, definition, snapshot } = await getLifeEventMission(
    params.missionId,
    params.participantId
  );
  if (mission.stopState) {
    throw new ContinuityOsError("MISSION_STOPPED", "Mission is stopped.", 409);
  }

  const projection =
    snapshot != null
      ? {
          nodes: snapshot.nodesJson as ReturnType<
            typeof projectDependenciesFromTemplate
          >["nodes"],
          edges: snapshot.edgesJson as ReturnType<
            typeof projectDependenciesFromTemplate
          >["edges"],
          responsibilities: snapshot.responsibilitiesJson as ReturnType<
            typeof projectDependenciesFromTemplate
          >["responsibilities"],
          unknowns: snapshot.unknownsJson as string[],
          blockers: snapshot.blockersJson as string[],
          singlePointsOfFailure: projectDependenciesFromTemplate({
            definition,
            participantGoal: extension.participantGoal,
            unknowns: snapshot.unknownsJson as string[],
            blockers: snapshot.blockersJson as string[],
          }).singlePointsOfFailure,
        }
      : projectDependenciesFromTemplate({
          definition,
          participantGoal: extension.participantGoal,
          unknowns: extension.unknownsJson as string[],
          blockers: extension.blockersJson as string[],
        });

  const unconfirmedRequired = projection.nodes.filter(
    (n) => n.required && (n.state === "unconfirmed" || n.state === "unknown")
  ).length;

  const verifiedFallbacks = projection.nodes.filter(
    (n) => n.alternativeHint && n.state === "confirmed"
  ).length;

  const level = assessResilienceLevel({
    singlePointsOfFailure: projection.singlePointsOfFailure,
    unconfirmedRequired,
    verifiedFallbacks,
  });

  const timingConflicts: string[] = [];
  const arrival = projection.nodes.find((n) => n.code === "arrival_deadline");
  const transport = projection.nodes.find((n) => n.code === "accessible_transport");
  if (arrival && transport && transport.state !== "confirmed") {
    timingConflicts.push(
      "Accessible transport is not confirmed before the arrival deadline."
    );
  }

  const assessment = await prisma.continuityAssessment.create({
    data: {
      missionId: mission.id,
      assessmentType: "pre_mortem",
      level,
      singlePointsOfFailureJson: projection.singlePointsOfFailure,
      unconfirmedJson: projection.nodes
        .filter((n) => n.state === "unconfirmed" || n.state === "unknown")
        .map((n) => n.code),
      staleEvidenceJson: projection.nodes
        .filter((n) => n.freshness === "stale")
        .map((n) => n.code),
      timingConflictsJson: timingConflicts,
      missingAlternativesJson: projection.nodes
        .filter((n) => n.required && !n.alternativeHint)
        .map((n) => n.code),
      recoveryOptionsJson: projection.singlePointsOfFailure.map((code) => ({
        dependency: code,
        status: "draft_contingency_only",
        note: "Contingency draft only — not live monitoring or booking.",
      })),
      humanReviewNeedsJson: extension.safetyConcern
        ? ["safety_concern_human_review"]
        : projection.singlePointsOfFailure.length
          ? ["confirm_single_points_of_failure"]
          : [],
      participantActionsJson: [
        "Review unknown dependencies",
        "Confirm which alternatives are acceptable",
        "Choose whether to ask a human coordinator",
      ],
      nonAiContactsJson: [
        "MapAble navigator",
        "Transport coordinator",
        "Provider manager",
        "Rights officer",
      ],
    },
  });

  await appendMissionEvent({
    missionId: mission.id,
    participantId: params.participantId,
    eventType: "continuity.resilience_assessed",
    summary: `Resilience assessment level: ${level}`,
    payloadJson: { assessmentId: assessment.id, level },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "continuity.resilience.assessed",
    entityType: "ContinuityAssessment",
    entityId: assessment.id,
    participantId: params.participantId,
    metadata: { level },
  });

  return {
    assessment,
    projection,
    level,
    disclaimer:
      "This assessment describes service and environment dependencies only. It does not score participant capability, independence or worthiness.",
  };
}
