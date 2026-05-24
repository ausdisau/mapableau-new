import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function listEvacuationPlans(participantId: string) {
  return prisma.evacuationPlan.findMany({
    where: { participantId, active: true },
    include: { steps: { orderBy: { sortOrder: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getEvacuationPlan(planId: string, participantId: string) {
  return prisma.evacuationPlan.findFirst({
    where: { id: planId, participantId },
    include: { steps: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function createEvacuationPlan(
  participantId: string,
  data: {
    planType?: string;
    title: string;
    meetingPoint?: string;
    notes?: string;
    steps: { instruction: string; estimatedMinutes?: number }[];
  },
  actorUserId: string,
) {
  const plan = await prisma.evacuationPlan.create({
    data: {
      participantId,
      planType: (data.planType as never) ?? "home",
      title: data.title,
      meetingPoint: data.meetingPoint,
      notes: data.notes,
      steps: {
        create: data.steps.map((s, i) => ({
          sortOrder: i,
          instruction: s.instruction,
          estimatedMinutes: s.estimatedMinutes,
        })),
      },
    },
    include: { steps: true },
  });

  await createAuditEvent({
    actorUserId,
    action: "emergency.evacuation_plan.created",
    entityType: "EvacuationPlan",
    entityId: plan.id,
    participantId,
  });

  return plan;
}
