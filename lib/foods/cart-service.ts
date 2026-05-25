import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function getParticipantFoodCart(participantId: string) {
  return prisma.foodCart.upsert({
    where: { participantId },
    create: { participantId },
    update: {},
    include: { items: { include: { product: true } }, vendor: true },
  });
}

export async function addFoodCartItem(input: {
  participantId: string;
  productId: string;
  quantity: number;
}) {
  const product = await prisma.foodProduct.findFirstOrThrow({
    where: { id: input.productId, published: true },
    include: { vendor: true },
  });

  const cart = await prisma.foodCart.upsert({
    where: { participantId: input.participantId },
    create: { participantId: input.participantId, vendorId: product.vendorId },
    update: { vendorId: product.vendorId },
  });

  const item = await prisma.foodCartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId: product.id } },
    create: {
      cartId: cart.id,
      productId: product.id,
      quantity: input.quantity,
      titleSnapshot: product.title,
      unitPriceCents: product.priceCents,
      costType: "food_item",
      dietarySnapshot: product.dietaryTags,
      allergenSnapshot: product.allergenTags,
    },
    update: { quantity: { increment: input.quantity } },
    include: { product: true },
  });

  await createAuditEvent({
    actorUserId: input.participantId,
    action: "foods.cart.item_added",
    entityType: "FoodCart",
    entityId: cart.id,
    participantId: input.participantId,
    metadata: { productId: product.id },
  });

  return item;
}

export async function updateFoodCartItem(input: {
  participantId: string;
  itemId: string;
  quantity: number;
}) {
  const cart = await prisma.foodCart.findUniqueOrThrow({ where: { participantId: input.participantId } });
  const item = await prisma.foodCartItem.update({
    where: { id: input.itemId, cartId: cart.id },
    data: { quantity: input.quantity },
  });

  await createAuditEvent({
    actorUserId: input.participantId,
    action: "foods.cart.item_updated",
    entityType: "FoodCartItem",
    entityId: item.id,
    participantId: input.participantId,
  });

  return item;
}

export async function removeFoodCartItem(participantId: string, itemId: string) {
  const cart = await prisma.foodCart.findUniqueOrThrow({ where: { participantId } });
  const item = await prisma.foodCartItem.delete({ where: { id: itemId, cartId: cart.id } });

  await createAuditEvent({
    actorUserId: participantId,
    action: "foods.cart.item_removed",
    entityType: "FoodCartItem",
    entityId: item.id,
    participantId,
  });

  return item;
}

export const getFoodCart = getParticipantFoodCart;

