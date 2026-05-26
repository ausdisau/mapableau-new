import type { Prisma } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { buildPlanSummaryFromSections } from "@/lib/care-support/plan-summary";
import {
  assertCoordinatorCanAccessParticipant,
  assertParticipantSelfById,
  CareSupportAccessError,
} from "@/lib/care-support/access-control";
import { ensureCoordinationCaseForRelationship } from "@/lib/care-support/coordination-service";
import { createCoordinatorTaskForParticipant } from "@/lib/care-support/coordinator-tasks";

export async function listAssessmentsForParticipant(participantId: string) {
  return prisma.supportNeedsAssessment.findMany({
    where: { participantId },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
}

export async function getAssessmentById(assessmentId: string) {
  return prisma.supportNeedsAssessment.findUnique({
    where: { id: assessmentId },
  });
}

export async function createAssessment(params: {
  participantId: string;
  actorUserId: string;
  sectionsJson?: Record<string, unknown>;
  source?: "participant_self" | "coordinator" | "import_placeholder";
  asCoordinator?: boolean;
}) {
  if (params.asCoordinator) {
    await assertCoordinatorCanAccessParticipant(
      params.actorUserId,
      params.participantId,
      "care_support.assessment_share"
    );
  } else {
    assertParticipantSelfById(params.actorUserId, params.participantId);
  }

  const assessment = await prisma.supportNeedsAssessment.create({
    data: {
      participantId: params.participantId,
      sectionsJson: (params.sectionsJson ?? {}) as Prisma.InputJsonValue,
      source: params.asCoordinator ? "coordinator" : (params.source ?? "participant_self"),
      status: "draft",
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "care_support.assessment_created",
    entityType: "SupportNeedsAssessment",
    entityId: assessment.id,
    participantId: params.participantId,
  });

  return assessment;
}

export async function updateAssessment(params: {
  assessmentId: string;
  actorUserId: string;
  sectionsJson?: Record<string, unknown>;
  asCoordinator?: boolean;
}) {
  const existing = await prisma.supportNeedsAssessment.findUnique({
    where: { id: params.assessmentId },
  });
  if (!existing) throw new CareSupportAccessError("NOT_FOUND");

  if (params.asCoordinator) {
    await assertCoordinatorCanAccessParticipant(
      params.actorUserId,
      existing.participantId,
      "care_support.assessment_share"
    );
  } else {
    assertParticipantSelfById(params.actorUserId, existing.participantId);
    if (existing.status !== "draft") {
      throw new CareSupportAccessError("ASSESSMENT_NOT_EDITABLE");
    }
  }

  const assessment = await prisma.supportNeedsAssessment.update({
    where: { id: params.assessmentId },
    data: {
      ...(params.sectionsJson !== undefined
        ? { sectionsJson: params.sectionsJson as Prisma.InputJsonValue }
        : {}),
      version: { increment: 1 },
    },
  });

  return assessment;
}

export async function submitAssessment(assessmentId: string, actorUserId: string) {
  const existing = await prisma.supportNeedsAssessment.findUnique({
    where: { id: assessmentId },
  });
  if (!existing) throw new CareSupportAccessError("NOT_FOUND");
  assertParticipantSelfById(actorUserId, existing.participantId);
  if (existing.status !== "draft") {
    throw new CareSupportAccessError("ASSESSMENT_NOT_DRAFT");
  }

  const assessment = await prisma.supportNeedsAssessment.update({
    where: { id: assessmentId },
    data: {
      status: "submitted",
      submittedAt: new Date(),
    },
  });

  const summary = buildPlanSummaryFromSections(assessment.sectionsJson);
  await prisma.participantSupportPlanSummary.upsert({
    where: { participantId: existing.participantId },
    create: {
      participantId: existing.participantId,
      summaryJson: summary as Prisma.InputJsonValue,
    },
    update: {
      summaryJson: summary as Prisma.InputJsonValue,
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "care_support.assessment_submitted",
    entityType: "SupportNeedsAssessment",
    entityId: assessment.id,
    participantId: existing.participantId,
  });

  const rels = await prisma.supportCoordinatorRelationship.findMany({
    where: { participantId: existing.participantId, status: "active" },
  });
  for (const rel of rels) {
    await ensureCoordinationCaseForRelationship(rel.id, assessment.id);
    await createCoordinatorTaskForParticipant({
      participantId: existing.participantId,
      coordinatorId: rel.coordinatorId,
      taskType: "review_assessment",
      title: "Review submitted support needs assessment",
    });
  }

  return assessment;
}

export async function reviewAssessment(
  assessmentId: string,
  coordinatorId: string
) {
  const existing = await prisma.supportNeedsAssessment.findUnique({
    where: { id: assessmentId },
  });
  if (!existing) throw new CareSupportAccessError("NOT_FOUND");

  await assertCoordinatorCanAccessParticipant(
    coordinatorId,
    existing.participantId,
    "care_support.assessment_share"
  );

  return prisma.supportNeedsAssessment.update({
    where: { id: assessmentId },
    data: {
      status: "reviewed",
      reviewedByCoordinatorId: coordinatorId,
      reviewedAt: new Date(),
    },
  });
}

/** Coordinator view: rollup unless full assessment scope implied via active relationship. */
export async function getAssessmentForCoordinatorView(
  assessmentId: string,
  coordinatorId: string
) {
  const assessment = await getAssessmentById(assessmentId);
  if (!assessment) return null;

  await assertCoordinatorCanAccessParticipant(
    coordinatorId,
    assessment.participantId,
    "care_support.assessment_share"
  );

  const hasDetail = await import("@/lib/support-coordinator/consent-gate").then((m) =>
    m.coordinatorHasScope(
      assessment.participantId,
      coordinatorId,
      "care_support.assessment_detail"
    )
  );

  if (hasDetail) return assessment;

  return {
    ...assessment,
    sectionsJson: buildPlanSummaryFromSections(assessment.sectionsJson),
  };
}
