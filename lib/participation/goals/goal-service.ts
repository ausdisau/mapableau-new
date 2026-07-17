import { prisma } from "@/lib/prisma";
import { asJson } from "@/lib/prisma-json";
import { assertParticipationPlannerEnabled } from "@/lib/participation/feature-flags";
import { defaultPrivacyForParticipation } from "@/lib/participation/privacy/sensitive-domains";
import type {
  ParticipationDomainValue,
  ParticipationGoalStatusValue,
  ParticipationPrivacyLevelValue,
} from "@/lib/participation/types";

export interface CreateParticipationGoalInput {
  participantId: string;
  title?: string;
  participantWording?: string;
  interpretedSummary?: string;
  domain?: ParticipationDomainValue;
  desiredExperience?: string;
  successDescription?: string;
  boundaries?: Record<string, unknown>;
  constraints?: Record<string, unknown>;
  privacyLevel?: ParticipationPrivacyLevelValue;
  tenantId?: string;
  organisationId?: string;
  startsAt?: Date;
  expiresAt?: Date;
  targetDate?: Date;
  notes?: string;
}

export function goalTitleFromParticipantWording(input: {
  title?: string;
  participantWording?: string;
}): string {
  const wording = input.participantWording?.trim();
  if (wording) return wording.slice(0, 160);
  const title = input.title?.trim();
  if (title) return title;
  throw new Error("PARTICIPANT_WORDING_REQUIRED");
}

export function buildParticipationGoalCreateData(
  input: CreateParticipationGoalInput,
) {
  const title = goalTitleFromParticipantWording(input);
  return {
    participantId: input.participantId,
    organisationId: input.organisationId,
    tenantId: input.tenantId,
    title,
    participantWording: input.participantWording ?? title,
    interpretedSummary: input.interpretedSummary,
    domain: input.domain,
    desiredExperience: input.desiredExperience,
    successDescription: input.successDescription,
    boundaries: asJson(input.boundaries),
    constraints: asJson(input.constraints),
    privacyLevel:
      input.privacyLevel ??
      defaultPrivacyForParticipation({
        domain: input.domain,
        text: `${input.participantWording ?? ""} ${input.title ?? ""}`,
      }),
    startsAt: input.startsAt,
    expiresAt: input.expiresAt,
    targetDate: input.targetDate,
    notes: input.notes,
    status: "draft" as ParticipationGoalStatusValue,
  };
}

export async function createGoal(input: CreateParticipationGoalInput) {
  assertParticipationPlannerEnabled();
  return prisma.participationGoal.create({
    data: buildParticipationGoalCreateData(input),
  });
}

export async function listGoalsForParticipant(participantId: string) {
  assertParticipationPlannerEnabled();
  return prisma.participationGoal.findMany({
    where: {
      participantId,
      status: { notIn: ["cancelled", "archived"] },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
}

export async function getGoalForParticipant(params: {
  goalId: string;
  participantId: string;
}) {
  assertParticipationPlannerEnabled();
  return prisma.participationGoal.findFirst({
    where: { id: params.goalId, participantId: params.participantId },
  });
}

export async function confirmGoal(params: {
  goalId: string;
  participantId: string;
}) {
  assertParticipationPlannerEnabled();
  const goal = await getGoalForParticipant(params);
  if (!goal) throw new Error("GOAL_NOT_FOUND");
  return prisma.participationGoal.update({
    where: { id: goal.id },
    data: { status: "confirmed", confirmedAt: new Date() },
  });
}

export async function pauseGoal(params: {
  goalId: string;
  participantId: string;
}) {
  assertParticipationPlannerEnabled();
  const goal = await getGoalForParticipant(params);
  if (!goal) throw new Error("GOAL_NOT_FOUND");
  return prisma.participationGoal.update({
    where: { id: goal.id },
    data: { status: "paused" },
  });
}

export async function markGoalChanged(params: {
  goalId: string;
  participantId: string;
  participantWording: string;
}) {
  assertParticipationPlannerEnabled();
  const goal = await getGoalForParticipant(params);
  if (!goal) throw new Error("GOAL_NOT_FOUND");
  return prisma.participationGoal.update({
    where: { id: goal.id },
    data: {
      status: "changed",
      participantWording: params.participantWording,
      title: goalTitleFromParticipantWording({
        participantWording: params.participantWording,
      }),
    },
  });
}

export function goalChangeIsFailure(status: ParticipationGoalStatusValue) {
  return status !== "changed";
}
