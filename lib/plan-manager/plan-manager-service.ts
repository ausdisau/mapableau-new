import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  checkPlanManagerParticipantAccess,
  logConsentGatedAccess,
} from "@/lib/access/consent-aware-access";
import { createNotificationEvent } from "@/lib/access/notification-event-service";
import { notifyUser } from "@/lib/notifications/notification-service";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/types/mapable";

import { hasPlanManagerAccess } from "./plan-manager-access-policy";

export async function getPlanManagerProfile(userId: string) {
  return prisma.planManagerProfile.findUnique({ where: { userId } });
}

export async function listLinkedParticipants(planManagerId: string) {
  const rels = await prisma.planManagerRelationship.findMany({
    where: { planManagerId, status: "active" },
  });

  return Promise.all(
    rels.map(async (rel) => {
      const profile = await prisma.participantProfile.findUnique({
        where: { userId: rel.participantId },
        select: { displayName: true, preferredName: true },
      });
      return {
        participantId: rel.participantId,
        displayName:
          profile?.preferredName ?? profile?.displayName ?? "Participant",
        linkedAt: rel.createdAt,
      };
    })
  );
}

export async function listPlanManagerInvoices(params: {
  planManagerId: string;
  actorRole: UserRole;
}) {
  const rels = await prisma.planManagerRelationship.findMany({
    where: { planManagerId: params.planManagerId, status: "active" },
  });
  const participantIds = rels.map((r) => r.participantId);

  const inbox = await prisma.planManagerInvoiceInbox.findMany({
    where: { planManagerId: params.planManagerId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const invoiceIds = inbox.map((i) => i.invoiceId);
  const invoices = await prisma.invoice.findMany({
    where: {
      id: { in: invoiceIds.length ? invoiceIds : ["__none__"] },
      participantId: { in: participantIds },
    },
    include: {
      lines: true,
      organisation: { select: { name: true } },
    },
  });

  return invoices.map((inv) => {
    const inboxItem = inbox.find((i) => i.invoiceId === inv.id);
    return {
      ...inv,
      inboxStatus: inboxItem?.status ?? "pending",
      claimWarnings: inboxItem?.claimWarnings ?? [],
    };
  });
}

export async function getInvoiceForPlanManager(params: {
  invoiceId: string;
  planManagerId: string;
  actorRole: UserRole;
}) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.invoiceId },
    include: {
      lines: true,
      organisation: { select: { name: true } },
      booking: { select: { id: true, bookingType: true, status: true } },
    },
  });
  if (!invoice) throw new Error("NOT_FOUND");

  const access = await checkPlanManagerParticipantAccess({
    planManagerId: params.planManagerId,
    participantId: invoice.participantId,
    actorRole: params.actorRole,
  });

  await logConsentGatedAccess({
    actorUserId: params.planManagerId,
    actorRole: params.actorRole,
    participantId: invoice.participantId,
    resourceType: "Invoice",
    resourceId: invoice.id,
    action: "view",
    accessResult: access,
  });

  if (!access.allowed) throw new Error("CONSENT_REQUIRED");

  const inbox = await prisma.planManagerInvoiceInbox.findUnique({
    where: {
      invoiceId_planManagerId: {
        invoiceId: params.invoiceId,
        planManagerId: params.planManagerId,
      },
    },
  });

  const payment = await prisma.paymentProcessingRecord.findFirst({
    where: {
      invoiceId: params.invoiceId,
      planManagerId: params.planManagerId,
    },
    orderBy: { updatedAt: "desc" },
  });

  const serviceLogs = await prisma.booking.findMany({
    where: { participantId: invoice.participantId },
    take: 5,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      bookingType: true,
      status: true,
      requestedStart: true,
    },
  });

  const warnings = buildClaimValidationWarnings(invoice);

  return {
    invoice,
    inbox,
    payment,
    serviceLogs,
    claimWarnings: warnings,
    disclaimer:
      "This review supports your workflow. MapAble does not guarantee NDIS payment approval.",
  };
}

function buildClaimValidationWarnings(
  invoice: {
    lines: { description: string; supportItemCode?: string | null }[];
    totalCents: number;
    status: string;
  }
) {
  const warnings: string[] = [];
  if (invoice.totalCents <= 0) {
    warnings.push("Invoice total is zero — check line items.");
  }
  if (invoice.lines.length === 0) {
    warnings.push("No line items found — invoice may be incomplete.");
  }
  for (const line of invoice.lines) {
    if (!line.supportItemCode) {
      warnings.push(
        `Line "${line.description}" is missing an NDIS support item code.`
      );
    }
  }
  if (invoice.status === "draft") {
    warnings.push("Invoice is still in draft — provider may need to finalise it.");
  }
  return warnings;
}

export async function syncInvoiceToInbox(params: {
  invoiceId: string;
  planManagerId: string;
  participantId: string;
}) {
  const allowed = await hasPlanManagerAccess(
    params.participantId,
    params.planManagerId
  );
  if (!allowed) return null;

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.invoiceId },
    include: { lines: true },
  });
  if (!invoice) return null;

  const warnings = buildClaimValidationWarnings(invoice);

  return prisma.planManagerInvoiceInbox.upsert({
    where: {
      invoiceId_planManagerId: {
        invoiceId: params.invoiceId,
        planManagerId: params.planManagerId,
      },
    },
    create: {
      invoiceId: params.invoiceId,
      planManagerId: params.planManagerId,
      participantId: params.participantId,
      claimWarnings: warnings,
      ndisLineItems: invoice.lines.map((l) => ({
        description: l.description,
        supportItemCode: l.supportItemCode,
      })),
    },
    update: {
      claimWarnings: warnings,
      ndisLineItems: invoice.lines.map((l) => ({
        description: l.description,
        supportItemCode: l.supportItemCode,
      })),
    },
  });
}
