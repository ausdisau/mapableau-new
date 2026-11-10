/**
 * Care Introduction — governed object (request → accept/decline → audit).
 * Never auto-assigns a worker. Participant owns the decision.
 */

import type { CareIntroductionStatus, Prisma } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { carePilotConfig, isCareIntroductionsEnabled } from "@/lib/config/care-pilot";
import { prisma } from "@/lib/prisma";

export type CreateIntroductionInput = {
  participantId: string;
  requestedById: string;
  careRequestId?: string;
  candidateType: "worker" | "provider";
  candidateWorkerProfileId?: string;
  candidateOrganisationId?: string;
  lane?: "assured" | "choice" | "partner";
  messageToCandidate?: string;
  /** Participant-selected ranking criteria — never pay-to-rank. */
  rankingCriteria?: string[];
  expiresAt?: Date;
};

function assertIntroductionsEnabled(): void {
  if (!isCareIntroductionsEnabled()) {
    throw new Error("CARE_INTRODUCTIONS_DISABLED");
  }
}

export async function requestCareIntroduction(input: CreateIntroductionInput) {
  assertIntroductionsEnabled();

  if (input.requestedById !== input.participantId) {
    // Decision supporters may request on behalf only when separately authorised;
    // first slice requires participant actor.
    throw new Error("CARE_INTRODUCTION_PARTICIPANT_ONLY");
  }

  if (
    input.candidateType === "worker" &&
    !input.candidateWorkerProfileId
  ) {
    throw new Error("CARE_INTRODUCTION_WORKER_REQUIRED");
  }
  if (
    input.candidateType === "provider" &&
    !input.candidateOrganisationId
  ) {
    throw new Error("CARE_INTRODUCTION_PROVIDER_REQUIRED");
  }

  if (input.careRequestId) {
    const req = await prisma.careRequest.findUnique({
      where: { id: input.careRequestId },
    });
    if (!req || req.participantId !== input.participantId) {
      throw new Error("CARE_INTRODUCTION_REQUEST_FORBIDDEN");
    }
  }

  const introduction = await prisma.careIntroduction.create({
    data: {
      participantId: input.participantId,
      requestedById: input.requestedById,
      careRequestId: input.careRequestId,
      candidateType: input.candidateType,
      candidateWorkerProfileId: input.candidateWorkerProfileId,
      candidateOrganisationId: input.candidateOrganisationId,
      lane: input.lane,
      messageToCandidate: input.messageToCandidate?.slice(0, 2000),
      rankingCriteria: (input.rankingCriteria ?? []) as Prisma.InputJsonValue,
      expiresAt: input.expiresAt,
      status: "requested",
    },
  });

  await createAuditEvent({
    actorUserId: input.requestedById,
    action: "care_introduction.requested",
    entityType: "CareIntroduction",
    entityId: introduction.id,
    participantId: input.participantId,
    metadata: {
      candidateType: input.candidateType,
      lane: input.lane ?? null,
      autoAssigned: false,
      payToRank: false,
    },
  });

  return introduction;
}

export async function respondToCareIntroduction(input: {
  introductionId: string;
  actorUserId: string;
  decision: "accepted" | "declined";
  responseNote?: string;
}) {
  assertIntroductionsEnabled();

  const existing = await prisma.careIntroduction.findUnique({
    where: { id: input.introductionId },
  });
  if (!existing) throw new Error("CARE_INTRODUCTION_NOT_FOUND");
  if (existing.status !== "requested") {
    throw new Error("CARE_INTRODUCTION_NOT_PENDING");
  }
  if (existing.expiresAt && existing.expiresAt.getTime() < Date.now()) {
    await prisma.careIntroduction.update({
      where: { id: existing.id },
      data: { status: "expired" },
    });
    throw new Error("CARE_INTRODUCTION_EXPIRED");
  }

  const status: CareIntroductionStatus = input.decision;

  const updated = await prisma.careIntroduction.update({
    where: { id: existing.id },
    data: {
      status,
      responseNote: input.responseNote?.slice(0, 2000),
      respondedById: input.actorUserId,
      respondedAt: new Date(),
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    action:
      input.decision === "accepted"
        ? "care_introduction.accepted"
        : "care_introduction.declined",
    entityType: "CareIntroduction",
    entityId: updated.id,
    participantId: existing.participantId,
    metadata: {
      previousStatus: existing.status,
      autoAssigned: false,
    },
  });

  return updated;
}

export async function withdrawCareIntroduction(input: {
  introductionId: string;
  participantId: string;
  actorUserId: string;
}) {
  assertIntroductionsEnabled();
  const existing = await prisma.careIntroduction.findUnique({
    where: { id: input.introductionId },
  });
  if (!existing) throw new Error("CARE_INTRODUCTION_NOT_FOUND");
  if (existing.participantId !== input.participantId) {
    throw new Error("CARE_INTRODUCTION_FORBIDDEN");
  }
  if (existing.status !== "requested") {
    throw new Error("CARE_INTRODUCTION_NOT_PENDING");
  }

  const updated = await prisma.careIntroduction.update({
    where: { id: existing.id },
    data: { status: "withdrawn" },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    action: "care_introduction.withdrawn",
    entityType: "CareIntroduction",
    entityId: updated.id,
    participantId: input.participantId,
  });

  return updated;
}

export async function listCareIntroductionsForParticipant(
  participantId: string,
) {
  if (!carePilotConfig.spineEnabled) {
    throw new Error("CARE_PILOT_SPINE_DISABLED");
  }
  return prisma.careIntroduction.findMany({
    where: { participantId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
