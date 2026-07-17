import type {
  NdisBillableItemStatus,
  NdisBillableServiceItem,
  NdisBillingRoute,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type SafeBillableItemView = {
  id: string;
  organisationId: string;
  participantId: string | null;
  billingRoute: NdisBillingRoute;
  ndisPaymentRoute: string | null;
  paymentDestination: string;
  chargeType: string;
  supportItemCode: string | null;
  supportDescription: string;
  serviceStartAt: string;
  serviceEndAt: string;
  quantity: string;
  unitType: string;
  unitPriceCents: number | null;
  subtotalCents: number | null;
  gstCents: number;
  totalCents: number | null;
  status: NdisBillableItemStatus;
  sourceKey: string;
  correctionGeneration: number;
  paymentHold: boolean;
  lockedAt: string | null;
  pricingRowId: string | null;
  pricingResolverVersion: string | null;
  bookingId: string | null;
  createdAt: string;
  updatedAt: string;
};

export function projectBillableItemSafe(
  item: NdisBillableServiceItem
): SafeBillableItemView {
  return {
    id: item.id,
    organisationId: item.organisationId,
    participantId: item.participantId,
    billingRoute: item.billingRoute,
    ndisPaymentRoute: item.ndisPaymentRoute,
    paymentDestination: item.paymentDestination,
    chargeType: item.chargeType,
    supportItemCode: item.supportItemCode,
    supportDescription: item.supportDescription,
    serviceStartAt: item.serviceStartAt.toISOString(),
    serviceEndAt: item.serviceEndAt.toISOString(),
    quantity: item.quantity.toString(),
    unitType: item.unitType,
    unitPriceCents: item.unitPriceCents,
    subtotalCents: item.subtotalCents,
    gstCents: item.gstCents,
    totalCents: item.totalCents,
    status: item.status,
    sourceKey: item.sourceKey,
    correctionGeneration: item.correctionGeneration,
    paymentHold: item.paymentHold,
    lockedAt: item.lockedAt?.toISOString() ?? null,
    pricingRowId: item.pricingRowId,
    pricingResolverVersion: item.pricingResolverVersion,
    bookingId: item.bookingId,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function getBillableItemSafe(input: {
  organisationId: string;
  billableItemId: string;
}): Promise<SafeBillableItemView | null> {
  const item = await prisma.ndisBillableServiceItem.findFirst({
    where: {
      id: input.billableItemId,
      organisationId: input.organisationId,
    },
  });
  return item ? projectBillableItemSafe(item) : null;
}

export async function listBillableItemsSafe(input: {
  organisationId: string;
  status?: NdisBillableItemStatus;
  participantId?: string;
  billingRoute?: NdisBillingRoute;
  limit?: number;
}): Promise<SafeBillableItemView[]> {
  const items = await prisma.ndisBillableServiceItem.findMany({
    where: {
      organisationId: input.organisationId,
      ...(input.status ? { status: input.status } : {}),
      ...(input.participantId ? { participantId: input.participantId } : {}),
      ...(input.billingRoute ? { billingRoute: input.billingRoute } : {}),
    },
    orderBy: { serviceStartAt: "desc" },
    take: input.limit ?? 50,
  });
  return items.map(projectBillableItemSafe);
}
