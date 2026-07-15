import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { emitAccessNotification } from "@/lib/access-reviews/access-review-events";
import { prisma } from "@/lib/prisma";

export async function listActiveMappingChallenges(userId?: string) {
  const now = new Date();
  const challenges = await prisma.accessMappingChallenge.findMany({
    where: {
      status: "active",
      startsAt: { lte: now },
      endsAt: { gte: now },
      visibility: "public",
    },
    orderBy: { endsAt: "asc" },
    take: 20,
  });

  if (!userId) {
    return challenges.map((c) => ({
      id: c.id,
      title: c.title,
      plainLanguageDescription: c.plainLanguageDescription,
      geographicScope: c.geographicScope,
      targetFeature: c.targetFeature,
      startsAt: c.startsAt.toISOString(),
      endsAt: c.endsAt.toISOString(),
      targetCount: c.targetCount,
      progressCount: 0,
      completed: false,
    }));
  }

  const progress = await prisma.accessChallengeProgress.findMany({
    where: {
      userId,
      challengeId: { in: challenges.map((c) => c.id) },
    },
  });
  const byId = new Map(progress.map((p) => [p.challengeId, p]));

  return challenges.map((c) => {
    const p = byId.get(c.id);
    return {
      id: c.id,
      title: c.title,
      plainLanguageDescription: c.plainLanguageDescription,
      geographicScope: c.geographicScope,
      targetFeature: c.targetFeature,
      startsAt: c.startsAt.toISOString(),
      endsAt: c.endsAt.toISOString(),
      targetCount: c.targetCount,
      progressCount: p?.count ?? 0,
      completed: Boolean(p?.completedAt),
    };
  });
}

export async function incrementChallengeProgress(params: {
  challengeId: string;
  userId: string;
}) {
  const challenge = await prisma.accessMappingChallenge.findUnique({
    where: { id: params.challengeId },
  });
  if (!challenge || challenge.status !== "active") {
    throw new Error("NOT_FOUND");
  }

  const progress = await prisma.accessChallengeProgress.upsert({
    where: {
      challengeId_userId: {
        challengeId: params.challengeId,
        userId: params.userId,
      },
    },
    create: {
      challengeId: params.challengeId,
      userId: params.userId,
      count: 1,
    },
    update: { count: { increment: 1 } },
  });

  if (
    !progress.completedAt &&
    challenge.targetCount > 0 &&
    progress.count >= challenge.targetCount
  ) {
    await prisma.accessChallengeProgress.update({
      where: { id: progress.id },
      data: { completedAt: new Date() },
    });
    await createAuditEvent({
      actorUserId: params.userId,
      action: "accessibility.challenge.completed",
      entityType: "AccessMappingChallenge",
      entityId: challenge.id,
    });
    await emitAccessNotification({
      userId: params.userId,
      event: "accessibility.challenge.completed",
      title: "Mapping challenge completed",
      body: challenge.title,
    });
  }

  return progress;
}
