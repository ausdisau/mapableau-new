import type { FoodProductType } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export type FoodProductFilters = {
  q?: string;
  productType?: FoodProductType;
  dietary?: string;
  accessibility?: string;
  vendorId?: string;
};

export async function listPublishedFoodProducts(filters: FoodProductFilters = {}) {
  return prisma.foodProduct.findMany({
    where: {
      published: true,
      ...(filters.vendorId ? { vendorId: filters.vendorId } : {}),
      ...(filters.productType ? { productType: filters.productType } : {}),
      ...(filters.q
        ? {
            OR: [
              { title: { contains: filters.q, mode: "insensitive" } },
              { description: { contains: filters.q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(filters.dietary ? { dietaryTags: { has: filters.dietary } } : {}),
      ...(filters.accessibility ? { accessibilityTags: { has: filters.accessibility } } : {}),
    },
    include: { vendor: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getFoodProduct(productId: string) {
  return prisma.foodProduct.findUnique({
    where: { id: productId },
    include: { vendor: true },
  });
}

export async function createFoodProduct(input: {
  organisationId: string;
  actorUserId: string;
  title: string;
  description?: string;
  productType: FoodProductType;
  priceCents: number;
  preparationFeeCents?: number;
  deliveryFeeCents?: number;
  supportFeeCents?: number;
  dietaryTags?: string[];
  allergenTags?: string[];
  accessibilityTags?: string[];
  inventoryCount?: number;
  published?: boolean;
}) {
  const vendor = await prisma.foodVendor.upsert({
    where: { organisationId: input.organisationId },
    create: {
      organisationId: input.organisationId,
      displayName: "MapAble Foods vendor",
      openingHours: {},
    },
    update: {},
  });

  const product = await prisma.foodProduct.create({
    data: {
      vendorId: vendor.id,
      organisationId: input.organisationId,
      title: input.title,
      description: input.description,
      productType: input.productType,
      priceCents: input.priceCents,
      preparationFeeCents: input.preparationFeeCents ?? 0,
      deliveryFeeCents: input.deliveryFeeCents ?? 0,
      supportFeeCents: input.supportFeeCents ?? 0,
      dietaryTags: input.dietaryTags ?? [],
      allergenTags: input.allergenTags ?? [],
      accessibilityTags: input.accessibilityTags ?? [],
      inventoryCount: input.inventoryCount,
      published: input.published ?? false,
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    action: "foods.product.created",
    entityType: "FoodProduct",
    entityId: product.id,
    organisationId: input.organisationId,
  });

  return product;
}

export async function updateFoodProduct(productId: string, organisationId: string, actorUserId: string, data: Partial<{
  title: string;
  description: string;
  priceCents: number;
  preparationFeeCents: number;
  deliveryFeeCents: number;
  supportFeeCents: number;
  dietaryTags: string[];
  allergenTags: string[];
  accessibilityTags: string[];
  inventoryCount: number;
  published: boolean;
}>) {
  const product = await prisma.foodProduct.update({
    where: { id: productId },
    data,
  });

  await createAuditEvent({
    actorUserId,
    action: "foods.product.updated",
    entityType: "FoodProduct",
    entityId: product.id,
    organisationId,
  });

  return product;
}

export const getPublishedFoodProduct = getFoodProduct;
export async function listOrgFoodProducts(organisationIds: string[]) {
  return prisma.foodProduct.findMany({ where: { organisationId: { in: organisationIds } }, include: { vendor: true }, orderBy: { createdAt: 'desc' } });
}

