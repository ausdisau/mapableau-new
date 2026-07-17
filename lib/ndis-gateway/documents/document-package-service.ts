import type { NdisBillingRoute, NdisDocumentKind, Prisma } from "@prisma/client";

import { sumCents } from "@/lib/ndis-gateway/billing/money";
import { checksumJson } from "@/lib/ndis-gateway/documents/document-checksum";
import {
  allocateDocumentNumber,
  prefixForDocumentKind,
} from "@/lib/ndis-gateway/documents/document-number-service";
import {
  documentKindForBillingRoute,
  buildInvoiceDocument,
} from "@/lib/ndis-gateway/documents/invoice-builder";
import { buildNdiaPaymentPackage } from "@/lib/ndis-gateway/documents/ndia-payment-package-builder";
import {
  renderDocumentPlainText,
  renderDocumentSafeJson,
} from "@/lib/ndis-gateway/documents/document-renderer";
import { projectBillingDocumentSafe } from "@/lib/ndis-gateway/documents/document-projection";
import { createCorrelationId } from "@/lib/ndis-gateway/infrastructure/correlation";
import { sanitiseAuditJson } from "@/lib/ndis-gateway/security/log-sanitiser";
import { prisma } from "@/lib/prisma";

export type CreateDocumentPackageInput = {
  organisationId: string;
  actorUserId: string;
  billingRoute: NdisBillingRoute;
  billableItemIds: string[];
  participantId?: string | null;
  billingBatchId?: string | null;
  documentKind?: NdisDocumentKind;
};

export async function createDocumentPackage(input: CreateDocumentPackageInput) {
  const org = await prisma.organisation.findUnique({
    where: { id: input.organisationId },
  });
  if (!org) throw new Error("ORGANISATION_NOT_FOUND");

  const items = await prisma.ndisBillableServiceItem.findMany({
    where: {
      organisationId: input.organisationId,
      id: { in: input.billableItemIds },
    },
  });
  if (items.length !== input.billableItemIds.length) {
    throw new Error("BILLABLE_ITEMS_NOT_FOUND");
  }

  const documentKind =
    input.documentKind ?? documentKindForBillingRoute(input.billingRoute);
  const participantId =
    input.participantId ??
    (items.every((i) => i.participantId === items[0]?.participantId)
      ? items[0]?.participantId ?? null
      : null);

  if (
    (input.billingRoute === "ndis_self_managed" ||
      input.billingRoute === "ndis_plan_managed" ||
      input.billingRoute === "private_pay") &&
    !participantId
  ) {
    throw new Error("DOCUMENT_SINGLE_PARTICIPANT_REQUIRED");
  }

  const correlationId = createCorrelationId();

  const created = await prisma.$transaction(async (tx) => {
    const allocated = await allocateDocumentNumber({
      organisationId: input.organisationId,
      documentKind,
      prefix: prefixForDocumentKind(documentKind),
      tx,
    });

    const lines = items.map((i) => ({
      billableItemId: i.id,
      supportItemCode: i.supportItemCode,
      description: i.supportDescription,
      serviceStartAt: i.serviceStartAt.toISOString(),
      serviceEndAt: i.serviceEndAt.toISOString(),
      quantity: i.quantity.toString(),
      unitType: i.unitType,
      unitPriceCents: i.unitPriceCents ?? 0,
      totalCents: i.totalCents ?? 0,
    }));

    const renderable =
      input.billingRoute === "ndis_ndia_managed"
        ? buildNdiaPaymentPackage({
            documentNumber: allocated.documentNumber,
            organisationName: org.name,
            providerRegistrationNumber: org.ndisRegistrationNumber,
            lines,
          })
        : buildInvoiceDocument({
            documentNumber: allocated.documentNumber,
            organisationName: org.name,
            participantId,
            billingRoute: input.billingRoute,
            lines,
          });

    const safeJson = renderDocumentSafeJson(renderable);
    const contentHash = checksumJson(safeJson);
    const plain = renderDocumentPlainText(renderable);
    void plain;

    const subtotalCents = sumCents(lines.map((l) => l.totalCents));

    const doc = await tx.ndisBillingDocument.create({
      data: {
        organisationId: input.organisationId,
        participantId,
        billingRoute: input.billingRoute,
        documentKind,
        documentNumber: allocated.documentNumber,
        status: "generated",
        issueDate: new Date(),
        currency: "AUD",
        subtotalCents,
        gstCents: 0,
        totalCents: subtotalCents,
        contentHash,
        safeDocumentJson: sanitiseAuditJson(
          safeJson
        ) as Prisma.InputJsonValue,
        billingBatchId: input.billingBatchId ?? null,
        dispatchStatus: "ready",
        createdById: input.actorUserId,
        lines: {
          create: items.map((i, idx) => ({
            billableItemId: i.id,
            supportItemCode: i.supportItemCode,
            description: i.supportDescription,
            serviceStartAt: i.serviceStartAt,
            serviceEndAt: i.serviceEndAt,
            quantity: i.quantity,
            unitType: i.unitType,
            unitPriceCents: i.unitPriceCents ?? 0,
            subtotalCents: i.subtotalCents ?? i.totalCents ?? 0,
            gstCents: i.gstCents,
            totalCents: i.totalCents ?? 0,
            sortOrder: idx,
          })),
        },
      },
      include: { lines: true },
    });

    await tx.ndisBillableServiceItem.updateMany({
      where: { id: { in: items.map((i) => i.id) } },
      data: {
        status:
          input.billingRoute === "ndis_ndia_managed"
            ? "claim_packaged"
            : "invoiced",
      },
    });

    await tx.ndisWorkflowTransition.create({
      data: {
        organisationId: input.organisationId,
        entityType: "ndis_billing_document",
        entityId: doc.id,
        fromStatus: "none",
        toStatus: doc.status,
        actorUserId: input.actorUserId,
        correlationId,
        metadataJson: sanitiseAuditJson({
          documentNumber: doc.documentNumber,
          billableItemIds: items.map((i) => i.id),
          contentHash,
        }) as Prisma.InputJsonValue,
      },
    });

    return doc;
  });

  return {
    document: projectBillingDocumentSafe(created),
    documentId: created.id,
    correlationId,
  };
}
