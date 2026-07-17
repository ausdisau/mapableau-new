import type { RemedyActionType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type CreateRemedyInput = {
  appealId: string;
  actionType: RemedyActionType;
  description: string;
  downstreamRefs?: Prisma.InputJsonValue;
};

export async function createRemedyAction(input: CreateRemedyInput) {
  return prisma.remedyAction.create({
    data: {
      ...input,
      status: "pending",
    },
  });
}

export async function updateRemedyStatus(params: {
  remedyId: string;
  status: "pending" | "in_progress" | "completed" | "blocked";
  completedAt?: Date;
}) {
  return prisma.remedyAction.update({
    where: { id: params.remedyId },
    data: {
      status: params.status,
      completedAt:
        params.status === "completed"
          ? (params.completedAt ?? new Date())
          : undefined,
    },
  });
}

export async function requireRemediationForOverturn(params: {
  appealId: string;
  description: string;
  downstreamRefs?: Prisma.InputJsonValue;
}) {
  return createRemedyAction({
    appealId: params.appealId,
    actionType: "reverse_decision",
    description: params.description,
    downstreamRefs: params.downstreamRefs,
  });
}
