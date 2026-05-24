import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { remainingSystemsConfig } from "@/lib/config/remaining-systems";
import { prisma } from "@/lib/prisma";

export async function createGoal(params: {
  participantId: string;
  title: string;
  description?: string;
  actorId: string;
}) {
  if (!remainingSystemsConfig.independenceModuleEnabled) {
    throw new Error("INDEPENDENCE_DISABLED");
  }

  const goal = await prisma.independenceGoal.create({
    data: {
      participantId: params.participantId,
      title: params.title,
      description: params.description,
    },
  });

  await createAuditEvent({
    actorUserId: params.actorId,
    action: "independence.goal_created",
    entityType: "IndependenceGoal",
    entityId: goal.id,
    participantId: params.participantId,
  });

  return goal;
}

export async function createRoutine(params: {
  participantId: string;
  title: string;
  steps: { title: string; prompt?: string }[];
}) {
  return prisma.dailyRoutine.create({
    data: {
      participantId: params.participantId,
      title: params.title,
      steps: {
        create: params.steps.map((s, i) => ({
          order: i + 1,
          title: s.title,
          prompt: s.prompt,
        })),
      },
    },
    include: { steps: true },
  });
}

export async function addProgressEntry(params: {
  participantId: string;
  goalId?: string;
  note?: string;
}) {
  return prisma.progressEntry.create({ data: params });
}
