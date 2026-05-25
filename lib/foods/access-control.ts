import type { FoodOrder } from "@prisma/client";

import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { checkConsent } from "@/lib/consent/consent-service";
import { prisma } from "@/lib/prisma";

import { logSensitiveAccess } from "./data-access-log";

export class FoodAccessError extends Error {
  constructor(
    message: string,
    public code: "FORBIDDEN" | "NOT_FOUND" = "FORBIDDEN"
  ) {
    super(message);
    this.name = "FoodAccessError";
  }
}

export type FoodAddressViewRole =
  | "participant"
  | "vendor"
  | "driver"
  | "plan_manager"
  | "public"
  | "family";

export async function assertVendorOrgAccess(
  user: CurrentUser,
  vendorId: string
): Promise<void> {
  if (isAdminRole(user.primaryRole)) return;
  const vendor = await prisma.foodVendor.findUnique({
    where: { id: vendorId },
    select: { organisationId: true },
  });
  if (!vendor) throw new FoodAccessError("Vendor not found", "NOT_FOUND");
  const orgIds = await getUserOrganisationIds(user.id);
  if (!orgIds.includes(vendor.organisationId)) {
    throw new FoodAccessError("Vendor organisation access denied");
  }
}

export function assertParticipantOwnsOrder(
  user: CurrentUser,
  order: Pick<FoodOrder, "participantId">
): void {
  if (isAdminRole(user.primaryRole)) return;
  if (order.participantId !== user.id) {
    throw new FoodAccessError("Participant access denied");
  }
}

export async function assertDriverAssigned(
  user: CurrentUser,
  orderId: string
): Promise<void> {
  if (isAdminRole(user.primaryRole)) return;
  const assignment = await prisma.foodDeliveryAssignment.findUnique({
    where: { orderId },
    select: { driverUserId: true },
  });
  if (!assignment?.driverUserId || assignment.driverUserId !== user.id) {
    throw new FoodAccessError("Driver assignment access denied");
  }
}

export async function assertPlanManagerInvoiceAccess(
  actor: CurrentUser,
  participantId: string
): Promise<void> {
  if (isAdminRole(actor.primaryRole)) return;
  const invoiceOk = await checkConsent({
    subjectUserId: participantId,
    scope: "foods.invoice_share",
    grantedToUserId: actor.id,
  });
  const legacyOk = await checkConsent({
    subjectUserId: participantId,
    scope: "plan_manager.invoice_access",
    grantedToUserId: actor.id,
  });
  if (!invoiceOk && !legacyOk) {
    throw new FoodAccessError("Plan manager invoice consent required");
  }
  await logSensitiveAccess({
    actorUserId: actor.id,
    subjectUserId: participantId,
    resourceType: "FoodInvoice",
    purpose: "invoice_review",
    consentScope: invoiceOk ? "foods.invoice_share" : "plan_manager.invoice_access",
  });
}

export function getDeliveryAddressForRole(
  order: Pick<
    FoodOrder,
    | "deliveryAddressFull"
    | "deliveryAddressSuburb"
    | "handoverInstructionsJson"
  >,
  role: FoodAddressViewRole
): {
  suburb: string | null;
  fullAddress: string | null;
  handoverInstructions: unknown;
} {
  const suburb = order.deliveryAddressSuburb ?? null;
  const handoverInstructions = order.handoverInstructionsJson ?? null;

  if (role === "vendor" || role === "driver" || role === "participant") {
    return {
      suburb,
      fullAddress: order.deliveryAddressFull ?? null,
      handoverInstructions,
    };
  }

  return {
    suburb,
    fullAddress: null,
    handoverInstructions: role === "family" ? handoverInstructions : null,
  };
}

export async function getVendorIdForUser(userId: string): Promise<string | null> {
  const orgIds = await getUserOrganisationIds(userId);
  if (!orgIds.length) return null;
  const vendor = await prisma.foodVendor.findFirst({
    where: { organisationId: { in: orgIds } },
    select: { id: true },
  });
  return vendor?.id ?? null;
}
