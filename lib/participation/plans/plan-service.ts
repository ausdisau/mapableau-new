import { prisma } from "@/lib/prisma";
import { createParticipationJourneyReference } from "@/lib/participation/access/journey-adapter";
import { assertParticipationPlannerEnabled } from "@/lib/participation/feature-flags";
import {
  assertParticipationPlanTransition,
  cancellationBlocksFutureAccess,
} from "@/lib/participation/plans/plan-state-machine";
import { requestSupportAllocationReference } from "@/lib/participation/support/support-coordination-adapter";
import type { ParticipationPlanStatusValue } from "@/lib/participation/types";

export interface ParticipationPlanStepInput {
  stepType: string;
  title: string;
  description?: string;
  sortOrder?: number;
}

export function assertNoFundingAssumption(
  fundingText: string | null | undefined,
) {
  if (!fundingText) return;
  if (
    /\b(ndis eligible|ndis funded|claimable|covered by ndis)\b/i.test(
      fundingText,
    )
  ) {
    throw new Error("NDIS_ELIGIBILITY_MUST_NOT_BE_ASSUMED");
  }
}

export async function createParticipationPlan(input: {
  participantId: string;
  title: string;
  goalId?: string;
  opportunityId?: string;
  eventId?: string;
  participantNotes?: string;
  fundingText?: string;
  steps?: ParticipationPlanStepInput[];
}) {
  assertParticipationPlannerEnabled();
  assertNoFundingAssumption(input.fundingText);
  return prisma.participationPlan.create({
    data: {
      participantId: input.participantId,
      title: input.title,
      goalId: input.goalId,
      opportunityId: input.opportunityId,
      eventId: input.eventId,
      participantNotes: input.participantNotes,
      steps: {
        create: (input.steps ?? []).map((step, index) => ({
          stepType: step.stepType,
          title: step.title,
          description: step.description,
          sortOrder: step.sortOrder ?? index,
        })),
      },
    },
    include: { steps: true },
  });
}

export async function getParticipationPlan(params: {
  planId: string;
  participantId: string;
}) {
  assertParticipationPlannerEnabled();
  return prisma.participationPlan.findFirst({
    where: { id: params.planId, participantId: params.participantId },
    include: { steps: true, event: { include: { accessProfile: true } } },
  });
}

export async function simulateParticipationPlan(params: {
  planId: string;
  participantId: string;
}) {
  assertParticipationPlannerEnabled();
  const plan = await prisma.participationPlan.findFirst({
    where: { id: params.planId, participantId: params.participantId },
  });
  if (!plan) throw new Error("PLAN_NOT_FOUND");
  assertParticipationPlanTransition(
    plan.status as ParticipationPlanStatusValue,
    "simulated",
  );
  return prisma.participationPlan.update({
    where: { id: plan.id },
    data: { status: "simulated" },
    include: { steps: true },
  });
}

export async function approveParticipationPlan(params: {
  planId: string;
  participantId: string;
}) {
  assertParticipationPlannerEnabled();
  const plan = await getParticipationPlan(params);
  if (!plan) throw new Error("PLAN_NOT_FOUND");
  assertParticipationPlanTransition(
    plan.status as ParticipationPlanStatusValue,
    "approved",
  );
  return prisma.participationPlan.update({
    where: { id: plan.id },
    data: { status: "approved", approvedAt: new Date() },
    include: { steps: true },
  });
}

export async function executeParticipationPlan(params: {
  planId: string;
  participantId: string;
  calendarEventId?: string;
  bookingId?: string;
}) {
  assertParticipationPlannerEnabled();
  const plan = await getParticipationPlan(params);
  if (!plan) throw new Error("PLAN_NOT_FOUND");
  assertParticipationPlanTransition(
    plan.status as ParticipationPlanStatusValue,
    "executing",
  );
  const journey = await createParticipationJourneyReference({
    participantId: params.participantId,
  });
  const support = requestSupportAllocationReference();
  return prisma.participationPlan.update({
    where: { id: plan.id },
    data: {
      status: "executing",
      executedAt: new Date(),
      calendarEventId: params.calendarEventId,
      bookingId: params.bookingId,
      accessJourneyPlanId: journey.accessJourneyPlanId,
      supportAllocationNote: support.note,
    },
    include: { steps: true },
  });
}

export async function cancelParticipationPlan(params: {
  planId: string;
  participantId: string;
}) {
  assertParticipationPlannerEnabled();
  const plan = await getParticipationPlan(params);
  if (!plan) throw new Error("PLAN_NOT_FOUND");
  return prisma.participationPlan.update({
    where: { id: plan.id },
    data: { status: "cancelled", cancelledAt: new Date() },
    include: { steps: true },
  });
}

export function cancelPlanBlocksFutureAccess() {
  return cancellationBlocksFutureAccess();
}
