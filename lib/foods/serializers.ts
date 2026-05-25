import type { FoodDeliveryAssignment, FoodOrder } from "@prisma/client";

import type { FoodAddressViewRole } from "./access-control";
import { getDeliveryAddressForRole } from "./access-control";

type OrderWithRelations = FoodOrder & {
  items?: Array<{
    id: string;
    titleSnapshot: string;
    quantity: number;
    unitAmount: number;
    totalAmount: number;
    itemCostType: string;
    allergenTagsSnapshot: unknown;
  }>;
  events?: Array<{
    id: string;
    eventType: string;
    title: string;
    createdAt: Date;
  }>;
  delivery?: FoodDeliveryAssignment | null;
};

export function serializeFoodOrder(
  order: OrderWithRelations,
  role: FoodAddressViewRole
) {
  const address = getDeliveryAddressForRole(order, role);
  return {
    id: order.id,
    status: order.status,
    orderType: order.orderType,
    paymentStatus: order.paymentStatus,
    invoiceStatus: order.invoiceStatus,
    deliveryStatus: order.deliveryStatus,
    subtotalAmount: order.subtotalAmount,
    deliveryFeeAmount: order.deliveryFeeAmount,
    preparationFeeAmount: order.preparationFeeAmount,
    supportFeeAmount: order.supportFeeAmount,
    taxAmount: order.taxAmount,
    totalAmount: order.totalAmount,
    currency: order.currency,
    substitutionPolicy: order.substitutionPolicy,
    allergenAcknowledged: order.allergenAcknowledged,
    deliveryWindowStart: order.deliveryWindowStart,
    deliveryWindowEnd: order.deliveryWindowEnd,
    deliveryAddress: address,
    items: order.items,
    events: order.events,
    delivery: order.delivery
      ? {
          id: order.delivery.id,
          status: order.delivery.status,
          publicTrackingToken:
            role === "public" ? order.delivery.publicTrackingToken : undefined,
        }
      : null,
    ndisFundingNote: "review_required",
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export function serializePublicTracking(
  assignment: FoodDeliveryAssignment & {
    order: Pick<FoodOrder, "deliveryAddressSuburb" | "deliveryStatus">;
  }
) {
  return {
    status: assignment.status,
    suburb: assignment.order.deliveryAddressSuburb,
    updatedAt: assignment.updatedAt,
  };
}
