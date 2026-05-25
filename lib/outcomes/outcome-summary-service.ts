import { prisma } from "@/lib/prisma";

import { canViewParticipantOutcomes } from "./outcome-access-policy";
import type { CurrentUser } from "@/lib/auth/current-user";

export async function buildOutcomeSummary(
  participantId: string,
  viewer: CurrentUser
) {
  if (!(await canViewParticipantOutcomes(viewer, participantId))) {
    throw new Error("OUTCOMES_FORBIDDEN");
  }

  const goals = await prisma.outcomeGoal.findMany({
    where: { participantId, status: "active" },
    include: { checkins: { orderBy: { createdAt: "desc" }, take: 2 } },
  });

  const summary = {
    goalCount: goals.length,
    goals: goals.map((g) => ({
      id: g.id,
      goalText: g.goalText,
      recentCheckins: g.checkins.map((c) => c.narrativeUpdate),
    })),
    disclaimer:
      "This summary supports planning conversations. It is not funding or legal advice.",
  };

  await prisma.outcomeSummarySnapshot.create({
    data: {
      participantId,
      summaryJson: summary,
    },
  });

  return summary;
}
