import type {
  CoordinateCommunicationChannel,
  MapAbleUserRole,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { assertParticipantAccess } from "./access-service";
import { getCoordinateAIEngine } from "./ai/engine";
import { shouldEscalateToHumanReview } from "./ai/escalation";
import { logCoordinateAudit } from "./audit-service";
import { createHumanReviewTask } from "./review-service";
import { COORDINATE_AUDIT_ACTIONS } from "./types";

export async function createCommunicationDraft(params: {
  actorId: string;
  actorRole: MapAbleUserRole;
  participantId: string;
  channel: CoordinateCommunicationChannel;
  topic: string;
}) {
  await assertParticipantAccess(params);

  const profile = await prisma.participantProfile.findUnique({
    where: { userId: params.participantId },
    select: { displayName: true, preferredName: true },
  });

  const engine = getCoordinateAIEngine();
  const draft = engine.draftCommunication({
    participantName: profile?.preferredName ?? profile?.displayName ?? "there",
    topic: params.topic,
    channel: params.channel,
  });

  const escalation = shouldEscalateToHumanReview({
    confidence: draft.meta.confidence,
  });

  let reviewTaskId: string | undefined;
  if (escalation.escalate) {
    const task = await createHumanReviewTask({
      participantId: params.participantId,
      assigneeId: params.actorId,
      taskType: escalation.taskType,
      summary: `Review communication draft: ${params.topic}`,
      payloadJson: { topic: params.topic, channel: params.channel },
      confidence: draft.meta.confidence,
      reason: escalation.reason,
    });
    reviewTaskId = task.id;
  }

  const row = await prisma.coordinateCommunicationDraft.create({
    data: {
      participantId: params.participantId,
      authorId: params.actorId,
      channel: params.channel,
      subject: draft.subject,
      body: draft.body,
      plainLanguageBody: draft.plainLanguageBody,
      status: "pending_approval",
      confidence: draft.meta.confidence,
      reason: draft.meta.reason,
      reviewTaskId,
    },
  });

  await logCoordinateAudit({
    action: COORDINATE_AUDIT_ACTIONS.DRAFT_CREATED,
    actorUserId: params.actorId,
    actorRole: params.actorRole,
    entityType: "CoordinateCommunicationDraft",
    entityId: row.id,
    participantId: params.participantId,
  });

  return { draft: row, meta: draft.meta };
}

export async function listCommunicationDrafts(params: {
  actorId: string;
  actorRole: MapAbleUserRole;
  participantId: string;
}) {
  await assertParticipantAccess(params);
  return prisma.coordinateCommunicationDraft.findMany({
    where: { participantId: params.participantId },
    orderBy: { updatedAt: "desc" },
    include: { author: { select: { name: true } } },
  });
}

export async function approveCommunicationDraft(params: {
  actorId: string;
  actorRole: MapAbleUserRole;
  draftId: string;
  participantId: string;
}) {
  await assertParticipantAccess(params);

  const draft = await prisma.coordinateCommunicationDraft.findUnique({
    where: { id: params.draftId },
  });
  if (!draft || draft.participantId !== params.participantId) {
    throw new Error("NOT_FOUND");
  }

  const updated = await prisma.coordinateCommunicationDraft.update({
    where: { id: params.draftId },
    data: {
      status: "approved",
      approvedById: params.actorId,
      approvedAt: new Date(),
    },
  });

  await logCoordinateAudit({
    action: COORDINATE_AUDIT_ACTIONS.DRAFT_APPROVED,
    actorUserId: params.actorId,
    actorRole: params.actorRole,
    entityType: "CoordinateCommunicationDraft",
    entityId: updated.id,
    participantId: params.participantId,
    metadata: {
      note: "Approved for manual send only — not transmitted automatically.",
    },
  });

  return updated;
}

export async function updateCommunicationDraft(params: {
  actorId: string;
  actorRole: MapAbleUserRole;
  draftId: string;
  participantId: string;
  subject?: string;
  body?: string;
  plainLanguageBody?: string;
}) {
  await assertParticipantAccess(params);

  const draft = await prisma.coordinateCommunicationDraft.findUnique({
    where: { id: params.draftId },
  });
  if (!draft || draft.participantId !== params.participantId) {
    throw new Error("NOT_FOUND");
  }

  return prisma.coordinateCommunicationDraft.update({
    where: { id: params.draftId },
    data: {
      subject: params.subject ?? draft.subject,
      body: params.body ?? draft.body,
      plainLanguageBody: params.plainLanguageBody ?? draft.plainLanguageBody,
      status: "pending_approval",
    },
  });
}
