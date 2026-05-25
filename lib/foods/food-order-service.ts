import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

import {
  calculateSplitFromItems,
  persistFoodInvoiceSplit,
} from "./food-invoice-split-service";

export async function listActiveMenu() {
  return prisma.menuItem.findMany({
    where: { active: true },
    include: {
      allergens: { include: { allergy: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getMenuItem(id: string) {
  return prisma.menuItem.findUnique({
    where: { id, active: true },
    include: { allergens: { include: { allergy: true } } },
  });
}

function checkAllergyConflict(
  profileAllergies: string[],
  itemAllergenLabels: string[],
): string[] {
  const lower = profileAllergies.map((a) => a.toLowerCase());
  return itemAllergenLabels.filter((label) =>
    lower.some((a) => label.toLowerCase().includes(a) || a.includes(label.toLowerCase())),
  );
}

export async function createFoodOrder(params: {
  participantId: string;
  actorUserId: string;
  items: { menuItemId: string; quantity: number }[];
  deliveryAddress?: string;
  participantNotes?: string;
  allergyConfirmed: boolean;
}) {
  if (!params.allergyConfirmed) {
    throw new Error("ALLERGY_CONFIRMATION_REQUIRED");
  }

  const profile = await prisma.dietaryProfile.findUnique({
    where: { userId: params.participantId },
  });

  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: params.items.map((i) => i.menuItemId) }, active: true },
    include: { allergens: { include: { allergy: true } } },
  });

  if (menuItems.length !== params.items.length) {
    throw new Error("INVALID_MENU_ITEMS");
  }

  const conflicts: string[] = [];
  for (const item of menuItems) {
    const labels = item.allergens.map((a) => a.allergy.label);
    const c = checkAllergyConflict(profile?.allergies ?? [], labels);
    conflicts.push(...c);
  }

  const order = await prisma.foodOrder.create({
    data: {
      participantId: params.participantId,
      status: conflicts.length > 0 ? "allergy_pending" : "draft",
      deliveryAddress: params.deliveryAddress,
      participantNotes: params.participantNotes,
      allergyConfirmedAt: new Date(),
      allergyConfirmedById: params.actorUserId,
      items: {
        create: params.items.map((line) => {
          const menu = menuItems.find((m) => m.id === line.menuItemId)!;
          return {
            menuItemId: line.menuItemId,
            quantity: line.quantity,
            unitIngredientCents: menu.ingredientCostCents,
            unitPreparationCents: menu.preparationCostCents,
          };
        }),
      },
    },
    include: { items: { include: { menuItem: true } } },
  });

  const split = calculateSplitFromItems(order.items);
  await persistFoodInvoiceSplit(order.id, split);

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "foods.order.created",
    entityType: "FoodOrder",
    entityId: order.id,
    participantId: params.participantId,
    metadata: { conflicts, itemCount: params.items.length },
  });

  if (conflicts.length > 0) {
    await prisma.foodSafetyEvent.create({
      data: {
        foodOrderId: order.id,
        eventType: "allergy_review",
        description: `Possible allergen overlap: ${conflicts.join(", ")}`,
        createdById: params.actorUserId,
      },
    });
  }

  return { order, conflicts, split };
}

export async function submitFoodOrder(
  foodOrderId: string,
  actorUserId: string,
) {
  const order = await prisma.foodOrder.update({
    where: { id: foodOrderId },
    data: { status: "submitted" },
  });
  await createAuditEvent({
    actorUserId,
    action: "foods.order.submitted",
    entityType: "FoodOrder",
    entityId: foodOrderId,
    participantId: order.participantId,
  });
  return order;
}

export async function getFoodOrderForParticipant(
  foodOrderId: string,
  participantId: string,
) {
  return prisma.foodOrder.findFirst({
    where: { id: foodOrderId, participantId },
    include: {
      items: {
        include: {
          menuItem: {
            include: { allergens: { include: { allergy: true } } },
          },
        },
      },
      invoiceSplit: true,
      deliveryRun: true,
    },
  });
}
