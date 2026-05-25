import type {
  FoodDeliveryAssignment,
  FoodOrder,
  FoodOrderItem,
  FoodProduct,
  FoodVendor,
} from "@prisma/client";

import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { checkConsent } from "@/lib/consent/consent-service";
import { prisma } from "@/lib/prisma";

import { logSensitiveAccess } from "./data-access-log";

export type FoodAccessCode = "FORBIDDEN" | "NOT_FOUND";

export class FoodAccessError extends Error {
  constructor(public code: FoodAccessCode) {
    super(code);
  }
}

export function getDeliveryAddressForRole(
  order: Pick<
    FoodOrder,
    | "deliveryAddressFull"
    | "deliveryAddressSuburb"
    | "deliveryAddressState"
    | "deliveryAddressPostcode"
    | "deliveryInstructions"
  >,
  role: "participant" | "vendor" | "driver" | "plan_manager" | "admin" | "public"
) {
  const suburb = [order.deliveryAddressSuburb, order.deliveryAddressState]
    .filter(Boolean)
    .join(", ");

  if (role === "participant" || role === "vendor" || role === "driver" || role === "admin") {
    return {
      address: order.deliveryAddressFull,
      suburb: order.deliveryAddressSuburb,
      state: order.deliveryAddressState,
      postcode: order.deliveryAddressPostcode,
      instructions: role === "driver" || role === "vendor" ? order.deliveryInstructions : undefined,
      redacted: false,
    };
  }

  return {
    address: suburb || order.deliveryAddressSuburb || "Delivery suburb hidden",
    suburb: order.deliveryAddressSuburb,
    state: order.deliveryAddressState,
    postcode: undefined,
    instructions: undefined,
    redacted: true,
  };
}

export async function assertParticipantOwnsOrder(orderId: string, userId: string) {
  const order = await prisma.foodOrder.findUnique({ where: { id: orderId } });
  if (!order) throw new FoodAccessError("NOT_FOUND");
  if (order.participantId !== userId && order.nomineeId !== userId) {
    throw new FoodAccessError("FORBIDDEN");
  }
  return order;
}

export async function assertVendorOrgAccess(orderId: string, user: CurrentUser) {
  const order = await prisma.foodOrder.findUnique({ where: { id: orderId } });
  if (!order) throw new FoodAccessError("NOT_FOUND");
  if (isAdminRole(user.primaryRole)) return order;
  const orgIds = await getUserOrganisationIds(user.id);
  if (!orgIds.includes(order.organisationId)) {
    throw new FoodAccessError("FORBIDDEN");
  }
  return order;
}

export async function assertDriverAssigned(orderId: string, userId: string) {
  const assignment = await prisma.foodDeliveryAssignment.findUnique({
    where: { orderId },
    include: { order: true },
  });
  if (!assignment) throw new FoodAccessError("NOT_FOUND");
  if (assignment.driverUserId !== userId) throw new FoodAccessError("FORBIDDEN");
  return assignment;
}

export async function assertPlanManagerInvoiceAccess(orderId: string, user: CurrentUser) {
  const order = await prisma.foodOrder.findUnique({ where: { id: orderId } });
  if (!order) throw new FoodAccessError("NOT_FOUND");

  const hasConsent =
    (await checkConsent({
      subjectUserId: order.participantId,
      grantedToUserId: user.id,
      scope: "foods.invoice_share",
    })) ||
    (await checkConsent({
      subjectUserId: order.participantId,
      grantedToUserId: user.id,
      scope: "plan_manager.invoice_access",
    }));

  if (!hasConsent && !isAdminRole(user.primaryRole)) {
    throw new FoodAccessError("FORBIDDEN");
  }

  await logSensitiveAccess({
    actorUserId: user.id,
    subjectUserId: order.participantId,
    resourceType: "FoodOrder.invoice",
    resourceId: order.id,
    purpose: "invoice_review",
    consentScope: "foods.invoice_share",
  });

  return order;
}

export type FoodOrderWithItems = FoodOrder & {
  items: FoodOrderItem[];
  vendor?: FoodVendor | null;
  assignment?: FoodDeliveryAssignment | null;
};

export function toParticipantOrderDTO(order: FoodOrderWithItems) {
  return {
    id: order.id,
    status: order.status,
    paymentStatus: order.paymentStatus,
    invoiceStatus: order.invoiceStatus,
    vendorId: order.vendorId,
    vendorName: order.vendor?.displayName,
    deliveryWindowStart: order.deliveryWindowStart,
    deliveryWindowEnd: order.deliveryWindowEnd,
    address: getDeliveryAddressForRole(order, "participant"),
    items: order.items,
    totalCents: order.totalCents,
    ndisReviewRequired: true,
  };
}

export async function toVendorOrderDTO(order: FoodOrderWithItems, actorUserId?: string) {
  await logSensitiveAccess({
    actorUserId,
    subjectUserId: order.participantId,
    resourceType: "FoodOrder.deliveryAddress",
    resourceId: order.id,
    purpose: "order_fulfilment",
    consentScope: "foods.delivery_address_share",
  });
  return {
    ...toParticipantOrderDTO(order),
    participantId: order.participantId,
    address: getDeliveryAddressForRole(order, "vendor"),
    allergySnapshot: order.allergySnapshot,
    dietarySnapshot: order.dietarySnapshot,
  };
}

export async function toDriverDeliveryDTO(
  assignment: FoodDeliveryAssignment & { order: FoodOrder & { items: FoodOrderItem[] } },
  actorUserId?: string
) {
  await logSensitiveAccess({
    actorUserId,
    subjectUserId: assignment.order.participantId,
    resourceType: "FoodOrder.deliveryAddress",
    resourceId: assignment.order.id,
    purpose: "order_fulfilment",
    consentScope: "foods.delivery_address_share",
  });

  return {
    id: assignment.id,
    orderId: assignment.orderId,
    status: assignment.status,
    address: getDeliveryAddressForRole(assignment.order, "driver"),
    minimalAllergenFlags: Array.from(
      new Set(assignment.order.items.flatMap((item) => item.allergenSnapshot))
    ),
    handoverInstructions: assignment.handoverInstructions,
  };
}

export function toPublicTrackingDTO(
  assignment: FoodDeliveryAssignment & { order: Pick<FoodOrder, "deliveryAddressSuburb"> }
) {
  return {
    token: assignment.publicTrackingToken,
    status: assignment.status,
    suburb: assignment.order.deliveryAddressSuburb,
  };
}

export type FoodProductWithVendor = FoodProduct & { vendor: FoodVendor };
