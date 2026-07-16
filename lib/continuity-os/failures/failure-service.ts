import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { ContinuityOsError } from "@/lib/continuity-os/errors";
import {
  getContinuityOsFlags,
  isFailureDetectionEnabled,
  isShadowOrDemoMode,
} from "@/lib/continuity-os/feature-flags";
import {
  classifyServiceFailure,
  type ClassificationInput,
} from "@/lib/continuity-os/failures/classifier";
import { assertMissionNotStopped } from "@/lib/continuity-os/missions/careos-mission-adapter";
import { prisma } from "@/lib/prisma";

export async function reportServiceFailure(params: {
  participantId: string;
  actorUserId: string;
  missionId?: string;
  trigger: ClassificationInput["trigger"];
  summary: string;
  serviceDomain: string;
  serviceRefType?: string;
  serviceRefId?: string;
  observedAt?: Date;
  sourceType: string;
  sourceLabel?: string;
  essentialServiceImpact?: boolean;
  timeSensitive?: boolean;
  noAlternative?: boolean;
  safetyConcern?: boolean;
  hardRequirementFailed?: boolean;
  dependentNodeCount?: number;
  affectedDependencyCode?: string;
}) {
  if (!isFailureDetectionEnabled()) {
    throw new ContinuityOsError(
      "FAILURE_DETECTION_DISABLED",
      "Failure detection is disabled.",
      503
    );
  }

  if (params.missionId) {
    await assertMissionNotStopped(params.missionId);
  }

  const classification = classifyServiceFailure({
    trigger: params.trigger,
    essentialServiceImpact: params.essentialServiceImpact ?? true,
    timeSensitive: params.timeSensitive ?? true,
    noAlternative: params.noAlternative ?? false,
    safetyConcern: params.safetyConcern ?? false,
    falseReassurance: false,
    hardRequirementFailed: params.hardRequirementFailed ?? false,
    dependentNodeCount: params.dependentNodeCount ?? 0,
    evidenceConfidence: "unverified",
  });

  const failure = await prisma.serviceFailure.create({
    data: {
      missionId: params.missionId,
      participantId: params.participantId,
      status: isShadowOrDemoMode() ? "shadow_recorded" : "signal_received",
      failureClass: classification.failureClass,
      severity: classification.severity,
      serviceDomain: params.serviceDomain,
      serviceRefType: params.serviceRefType,
      serviceRefId: params.serviceRefId,
      summary: params.summary,
      observedAt: params.observedAt ?? new Date(),
      signals: {
        create: {
          sourceType: params.sourceType,
          sourceLabel: params.sourceLabel,
          observedAt: params.observedAt ?? new Date(),
          confidence: "unverified",
          urgency: classification.severity,
          affectedDependencyCode: params.affectedDependencyCode,
          evidenceJson: {
            trigger: params.trigger,
            reasons: classification.reasons,
            mode: getContinuityOsFlags().mode,
          },
        },
      },
    },
    include: { signals: true },
  });

  // Preserve prior plan by snapshotting current dependency projection if present.
  if (params.missionId) {
    const prior = await prisma.continuityDependencySnapshot.findFirst({
      where: { missionId: params.missionId },
      orderBy: { version: "desc" },
    });
    if (prior) {
      await prisma.serviceFailure.update({
        where: { id: failure.id },
        data: { priorPlanSnapshotId: prior.id },
      });
    }
  }

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "continuity.service_failure.signal_received",
    entityType: "ServiceFailure",
    entityId: failure.id,
    participantId: params.participantId,
    metadata: {
      failureClass: classification.failureClass,
      severity: classification.severity,
      mode: getContinuityOsFlags().mode,
      shadow: isShadowOrDemoMode(),
    },
  });

  return { failure, classification };
}

export async function assessServiceFailure(params: {
  failureId: string;
  participantId: string;
  actorUserId: string;
  verify?: boolean;
}) {
  if (!isFailureDetectionEnabled()) {
    throw new ContinuityOsError(
      "FAILURE_DETECTION_DISABLED",
      "Failure detection is disabled.",
      503
    );
  }

  const failure = await prisma.serviceFailure.findFirst({
    where: { id: params.failureId, participantId: params.participantId },
    include: { signals: true },
  });
  if (!failure) {
    throw new ContinuityOsError("NOT_FOUND", "Failure not found.", 404);
  }
  if (failure.missionId) {
    await assertMissionNotStopped(failure.missionId);
  }

  const impactVersion = failure.impactVersion + 1;
  const affectedDeps = failure.signals
    .map((s) => s.affectedDependencyCode)
    .filter(Boolean);

  const impact = await prisma.serviceFailureImpact.create({
    data: {
      serviceFailureId: failure.id,
      version: impactVersion,
      affectedDepsJson: affectedDeps,
      timingImpactJson: {
        note: "Downstream milestones may be at risk until recovery options are chosen.",
      },
      accessibilityImpactJson: {
        hardRequirementsMustRemainVisible: true,
      },
      disclosureImpactJson: {
        requireParticipantReviewBeforeExternalNotice: true,
      },
      financialImpactJson: {
        costsMustBeVisibleBeforeExecution: true,
      },
      noticeListJson: [],
      alternativesJson: [],
      priorPlanPreserved: true,
    },
  });

  const updated = await prisma.serviceFailure.update({
    where: { id: failure.id },
    data: {
      status: params.verify ? "verified" : failure.status,
      verifiedAt: params.verify ? new Date() : failure.verifiedAt,
      impactVersion,
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "continuity.service_failure.impact_calculated",
    entityType: "ServiceFailureImpact",
    entityId: impact.id,
    participantId: params.participantId,
    metadata: { impactVersion, priorPlanPreserved: true },
  });

  return { failure: updated, impact };
}

export async function getServiceFailure(
  failureId: string,
  participantId: string
) {
  const failure = await prisma.serviceFailure.findFirst({
    where: { id: failureId, participantId },
    include: { signals: true, impacts: { orderBy: { version: "desc" } } },
  });
  if (!failure) {
    throw new ContinuityOsError("NOT_FOUND", "Failure not found.", 404);
  }
  return failure;
}
