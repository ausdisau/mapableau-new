import type { AppealGroundType, AppealStatus } from "@prisma/client";

import { canTransitionAppeal } from "@/lib/public-interest-governance/appeals/appeal-state-machine";
import { prisma } from "@/lib/prisma";

export type SubmitAppealInput = {
  decisionId: string;
  tenantId?: string;
  appellantUserId: string;
  advocateUserId?: string;
  nonRetaliationAcknowledged: boolean;
  lateSubmissionReason?: string;
  grounds: Array<{
    groundType: AppealGroundType;
    narrative: string;
  }>;
  submissionBody: string;
  accessibleFormat?: string;
};

async function transitionAppeal(appealId: string, to: AppealStatus) {
  const appeal = await prisma.appealCase.findUnique({
    where: { id: appealId },
  });
  if (!appeal) throw new Error("APPEAL_NOT_FOUND");
  if (!canTransitionAppeal(appeal.status, to))
    throw new Error("INVALID_APPEAL_TRANSITION");

  return prisma.appealCase.update({
    where: { id: appealId },
    data: {
      status: to,
      closedAt:
        to === "closed" || to === "withdrawn" ? new Date() : appeal.closedAt,
    },
  });
}

export async function submitAppeal(input: SubmitAppealInput) {
  if (!input.nonRetaliationAcknowledged)
    throw new Error("NON_RETALIATION_ACKNOWLEDGEMENT_REQUIRED");
  if (input.grounds.length === 0) throw new Error("APPEAL_GROUND_REQUIRED");

  return prisma.appealCase.create({
    data: {
      decisionId: input.decisionId,
      tenantId: input.tenantId,
      appellantUserId: input.appellantUserId,
      advocateUserId: input.advocateUserId,
      nonRetaliationAcknowledged: input.nonRetaliationAcknowledged,
      serviceAccessContinued: true,
      lateSubmissionReason: input.lateSubmissionReason,
      status: "submitted",
      submittedAt: new Date(),
      grounds: {
        create: input.grounds,
      },
      submissions: {
        create: {
          kind: "statement",
          body: input.submissionBody,
          accessibleFormat: input.accessibleFormat,
        },
      },
    },
    include: { grounds: true, submissions: true },
  });
}

export async function acknowledgeAppeal(appealId: string) {
  return transitionAppeal(appealId, "acknowledged");
}

export async function requestAppealInformation(appealId: string, body: string) {
  const appeal = await transitionAppeal(appealId, "information_requested");
  await prisma.appealSubmission.create({
    data: {
      appealId,
      kind: "request_extension",
      body,
    },
  });
  return appeal;
}

export async function markAppealReviewerAssigned(appealId: string) {
  return transitionAppeal(appealId, "reviewer_assigned");
}

export async function decideAppeal(appealId: string) {
  const appeal = await prisma.appealCase.findUnique({
    where: { id: appealId },
  });
  if (!appeal) throw new Error("APPEAL_NOT_FOUND");
  if (appeal.status === "reviewer_assigned") {
    await transitionAppeal(appealId, "under_review");
  }
  await transitionAppeal(appealId, "decision_pending");
  return transitionAppeal(appealId, "resolved");
}

export async function withdrawAppeal(appealId: string) {
  return transitionAppeal(appealId, "withdrawn");
}
