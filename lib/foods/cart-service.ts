import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function getOrCreateCart(participantId: string) {
  return prisma.foodCart.upsert({
    where: { participantId },
    create: { participantId },
    update: {},
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
              priceAmount: true,
              status: true,
              vendorId: true,
              allergenTags: true,
              dietaryTags: true,
            },
          },
        },
      },
    },
  });
}

export async function addCartItem(
  participantId: string,
  productId: string,
  quantity: number
) {
  const product = await prisma.foodProduct.findFirst({
    where: { id: productId, status: "published" },
  });
  if (!product) throw new Error("PRODUCT_NOT_FOUND");

  const cart = await getOrCreateCart(participantId);
  if (cart.vendorId && cart.vendorId !== product.vendorId) {
    throw new Error("CART_VENDOR_MISMATCH");
  }
  if (!cart.vendorId) {
    await prisma.foodCart.update({
      where: { id: cart.id },
      data: { vendorId: product.vendorId },
    });
  }

  const item = await prisma.foodCartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    create: { cartId: cart.id, productId, quantity },
    update: { quantity },
    include: { product: true },
  });

  await createAuditEvent({
    actorUserId: participantId,
    action: "foods.cart.item_added",
    entityType: "FoodCartItem",
    entityId: item.id,
    participantId,
    metadata: { productId, quantity },
  });

  return getOrCreateCart(participantId);
}

export async function updateCartItem(
  participantId: string,
  itemId: string,
  quantity: number
) {
  const cart = await getOrCreateCart(participantId);
  const item = await prisma.foodCartItem.findFirst({
    where: { id: itemId, cartId: cart.id },
  });
  if (!item) throw new Error("CART_ITEM_NOT_FOUND");

  await prisma.foodCartItem.update({
    where: { id: itemId },
    data: { quantity },
  });

  await createAuditEvent({
    actorUserId: participantId,
    action: "foods.cart.item_updated",
    entityType: "FoodCartItem",
    entityId: itemId,
    participantId,
    metadata: { quantity },
  });

  return getOrCreateCart(participantId);
}

export async function removeCartItem(participantId: string, itemId: string) {
  const cart = await getOrCreateCart(participantId);
  const item = await prisma.foodCartItem.findFirst({
    where: { id: itemId, cartId: cart.id },
  });
  if (!item) throw new Error("CART_ITEM_NOT_FOUND");

  await prisma.foodCartItem.delete({ where: { id: itemId } });

  const remaining = await prisma.foodCartItem.count({
    where: { cartId: cart.id },
  });
  if (remaining === 0) {
    await prisma.foodCart.update({
      where: { id: cart.id },
      data: { vendorId: null },
    });
  }

  await createAuditEvent({
    actorUserId: participantId,
    action: "foods.cart.item_removed",
    entityType: "FoodCartItem",
    entityId: itemId,
    participantId,
  });

  return getOrCreateCart(participantId);
}
