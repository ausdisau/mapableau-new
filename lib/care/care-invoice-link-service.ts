import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { assertProviderOrgAccess } from "@/lib/care/access-control";
import type { CurrentUser } from "@/lib/auth/current-user";
import { lookupCataloguePrice } from "@/lib/ndis-pricing/catalogue-price-lookup";
import { prisma } from "@/lib/prisma";

export async function createInvoicePlaceholderForBooking(
  careBookingId: string,
  actorUser: CurrentUser
) {
  const booking = await prisma.careBooking.findUnique({
    where: { id: careBookingId },
    include: {
      serviceLogs: true,
      careRequest: { select: { supportItemCode: true } },
    },
  });
  if (!booking) throw new Error("NOT_FOUND");
  await assertProviderOrgAccess(actorUser, booking.organisationId);

  const confirmedLog = booking.serviceLogs.find((l) => l.status === "confirmed");
  if (!confirmedLog) {
    throw new Error("SERVICE_LOG_REQUIRED");
  }

  const existing = await prisma.careInvoiceLink.findFirst({
    where: { careBookingId, status: "placeholder" },
  });
  if (existing) return existing;

  const supportItemCode = booking.careRequest?.supportItemCode ?? null;
  const catalogue = supportItemCode
    ? await lookupCataloguePrice(supportItemCode)
    : null;

  const pricingPlaceholder = catalogue
    ? catalogue.formattedLine
    : supportItemCode
      ? `Support item ${supportItemCode} — no catalogue price loaded; import NDIS catalogue or enter line items manually. Claims remain manual.`
      : "No support item code on care request — add supportItemCode for catalogue pricing. Claims remain manual; no auto-submit to NDIA.";

  const link = await prisma.careInvoiceLink.create({
    data: {
      careBookingId,
      organisationId: booking.organisationId,
      careServiceLogId: confirmedLog.id,
      status: "placeholder",
      pricingPlaceholder,
      ndisLineItemCodePlaceholder: supportItemCode ?? undefined,
      externalInvoiceRef: `INV-PLACEHOLDER-${careBookingId.slice(0, 8)}`,
    },
  });

  await createAuditEvent({
    actorUserId: actorUser.id,
    action: "care_invoice.placeholder_created",
    entityType: "CareInvoiceLink",
    entityId: link.id,
    organisationId: booking.organisationId,
    participantId: booking.participantId,
  });

  return link;
}
