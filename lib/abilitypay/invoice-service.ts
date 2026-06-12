import type { MapAbleUserRole } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

import { prisma } from "@/lib/prisma";
import { storeDocumentFile, validateUpload } from "@/lib/storage/documents";
import type {
  createInvoiceSchema,
  updateInvoiceSchema,
} from "@/types/abilitypay";
import type { z } from "zod";

import { logAbilityPayEvent } from "./audit";
import { validateAbilityPayInvoice } from "./invoice-validation-service";

function calcLineTotal(quantity: number, unitPriceCents: number) {
  return Math.round(quantity * unitPriceCents);
}

export async function listInvoicesForUser(
  userId: string,
  role: MapAbleUserRole,
  filters?: { status?: string; participantId?: string }
) {
  if (role === "plan_manager") {
    const rels = await prisma.planManagerRelationship.findMany({
      where: { planManagerId: userId, status: "active" },
    });
    const participantIds = rels.map((r) => r.participantId);
    return prisma.abilityPayInvoice.findMany({
      where: {
        participantId: filters?.participantId
          ? filters.participantId
          : { in: participantIds },
        ...(filters?.status
          ? { status: filters.status as never }
          : {}),
      },
      include: {
        provider: true,
        riskFlags: { where: { resolved: false } },
        lineItems: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });
  }

  return prisma.abilityPayInvoice.findMany({
    where: {
      OR: [{ participantId: userId }, { createdById: userId }],
      ...(filters?.status ? { status: filters.status as never } : {}),
    },
    include: {
      provider: true,
      riskFlags: { where: { resolved: false } },
      lineItems: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
}

export async function getInvoiceById(invoiceId: string) {
  return prisma.abilityPayInvoice.findUnique({
    where: { id: invoiceId },
    include: {
      provider: { include: { credentials: true } },
      participant: { select: { id: true, name: true, email: true } },
      plan: { include: { categories: true } },
      lineItems: { orderBy: { sortOrder: "asc" }, include: { budgetCategory: true } },
      attachments: true,
      approvalEvents: { orderBy: { createdAt: "desc" }, include: { actor: { select: { name: true } } } },
      riskFlags: { where: { resolved: false }, orderBy: { createdAt: "desc" } },
      paymentAttempts: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function createInvoice(
  userId: string,
  input: z.infer<typeof createInvoiceSchema>
) {
  const participantId = input.participantId ?? userId;
  const lineItems = input.lineItems ?? [];

  let subtotalCents = 0;
  const lineData = lineItems.map((line, index) => {
    const qty = line.quantity ?? 1;
    const total = calcLineTotal(qty, line.unitPriceCents);
    subtotalCents += total;
    return {
      description: line.description,
      serviceDate: new Date(line.serviceDate),
      quantity: new Decimal(qty),
      unitPriceCents: line.unitPriceCents,
      totalCents: total,
      supportItemCode: line.supportItemCode,
      budgetCategoryId: line.budgetCategoryId,
      sortOrder: index,
    };
  });

  const invoice = await prisma.abilityPayInvoice.create({
    data: {
      participantId,
      createdById: userId,
      invoiceNumber: input.invoiceNumber,
      providerId: input.providerId,
      planId: input.planId,
      issueDate: input.issueDate ? new Date(input.issueDate) : undefined,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      serviceAgreementLinked: input.serviceAgreementLinked ?? false,
      serviceAgreementId: input.serviceAgreementId,
      notes: input.notes,
      subtotalCents,
      totalCents: subtotalCents,
      status: "draft",
      lineItems: lineData.length > 0 ? { create: lineData } : undefined,
    },
    include: { lineItems: true, provider: true, riskFlags: true },
  });

  await logAbilityPayEvent({
    action: "abilitypay.invoice.created",
    entityType: "AbilityPayInvoice",
    entityId: invoice.id,
    actorUserId: userId,
    participantId,
    metadata: { invoiceNumber: invoice.invoiceNumber },
  });

  return invoice;
}

export async function updateInvoice(
  invoiceId: string,
  userId: string,
  input: z.infer<typeof updateInvoiceSchema>
) {
  const before = await prisma.abilityPayInvoice.findUnique({
    where: { id: invoiceId },
  });
  if (!before) throw new Error("INVOICE_NOT_FOUND");

  const invoice = await prisma.abilityPayInvoice.update({
    where: { id: invoiceId },
    data: {
      invoiceNumber: input.invoiceNumber,
      providerId: input.providerId,
      planId: input.planId,
      status: input.status,
      issueDate:
        input.issueDate === null
          ? null
          : input.issueDate
            ? new Date(input.issueDate)
            : undefined,
      dueDate:
        input.dueDate === null
          ? null
          : input.dueDate
            ? new Date(input.dueDate)
            : undefined,
      serviceAgreementLinked: input.serviceAgreementLinked,
      serviceAgreementId: input.serviceAgreementId,
      notes: input.notes,
    },
    include: { lineItems: true, provider: true, riskFlags: true },
  });

  await logAbilityPayEvent({
    action: "abilitypay.invoice.updated",
    entityType: "AbilityPayInvoice",
    entityId: invoice.id,
    actorUserId: userId,
    participantId: invoice.participantId,
    metadata: { statusBefore: before.status, statusAfter: invoice.status },
  });

  return invoice;
}

export async function submitInvoiceForReview(invoiceId: string, userId: string) {
  const invoice = await prisma.abilityPayInvoice.update({
    where: { id: invoiceId },
    data: { status: "in_review", paymentStatus: "pending_review" },
    include: { lineItems: true },
  });

  await validateAbilityPayInvoice(invoiceId, userId);

  await logAbilityPayEvent({
    action: "abilitypay.invoice.submitted",
    entityType: "AbilityPayInvoice",
    entityId: invoiceId,
    actorUserId: userId,
    participantId: invoice.participantId,
  });

  return invoice;
}

export async function requestParticipantApproval(
  invoiceId: string,
  userId: string
) {
  const invoice = await prisma.abilityPayInvoice.update({
    where: { id: invoiceId },
    data: { status: "awaiting_participant", paymentStatus: "pending_review" },
  });

  await logAbilityPayEvent({
    action: "abilitypay.invoice.awaiting_participant",
    entityType: "AbilityPayInvoice",
    entityId: invoiceId,
    actorUserId: userId,
    participantId: invoice.participantId,
  });

  return invoice;
}

export async function attachInvoiceFile(
  invoiceId: string,
  userId: string,
  file: { buffer: Buffer; fileName: string; mimeType: string }
) {
  const stored = await storeDocumentFile(file.buffer, file.fileName);
  validateUpload(stored.mimeType, stored.fileSize);

  const attachment = await prisma.abilityPayInvoiceAttachment.create({
    data: {
      invoiceId,
      fileName: file.fileName,
      fileKey: stored.fileKey,
      mimeType: stored.mimeType,
      fileSize: stored.fileSize,
    },
  });

  const invoice = await prisma.abilityPayInvoice.findUnique({
    where: { id: invoiceId },
  });

  await logAbilityPayEvent({
    action: "abilitypay.invoice.attachment_added",
    entityType: "AbilityPayInvoiceAttachment",
    entityId: attachment.id,
    actorUserId: userId,
    participantId: invoice?.participantId,
    metadata: { fileName: file.fileName },
  });

  return attachment;
}

export async function listPendingApprovals(participantId: string) {
  return prisma.abilityPayInvoice.findMany({
    where: {
      participantId,
      status: "awaiting_participant",
    },
    include: {
      provider: true,
      riskFlags: { where: { resolved: false } },
      lineItems: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}
