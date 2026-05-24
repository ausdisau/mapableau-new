import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function listMealPlans(participantId: string) {
  return prisma.mealPlan.findMany({
    where: { participantId, active: true },
    include: {
      items: { include: { menuItem: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createMealPlan(params: {
  participantId: string;
  actorUserId: string;
  name: string;
  items: { menuItemId: string; quantity: number; dayOfWeek?: number }[];
}) {
  const profile = await prisma.dietaryProfile.findUnique({
    where: { userId: params.participantId },
  });
  if (!profile) throw new Error("DIETARY_PROFILE_REQUIRED");

  const plan = await prisma.mealPlan.create({
    data: {
      dietaryProfileId: profile.id,
      participantId: params.participantId,
      name: params.name,
      items: {
        create: params.items.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          dayOfWeek: i.dayOfWeek,
        })),
      },
    },
    include: { items: { include: { menuItem: true } } },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "foods.meal_plan.created",
    entityType: "MealPlan",
    entityId: plan.id,
    participantId: params.participantId,
  });

  return plan;
}
