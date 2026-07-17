import type { NdisBillingRoute, Prisma } from "@prisma/client";

import { evaluateBatchPolicy } from "@/lib/ndis-gateway/billing/batch-policy";
import { groupBillableItemsForBatching } from "@/lib/ndis-gateway/billing/batch-grouping";
import {
  allocateDocumentNumber,
  australianFinancialYear,
} from "@/lib/ndis-gateway/documents/document-number-service";
import { createCorrelationId } from "@/lib/ndis-gateway/infrastructure/correlation";
import { sanitiseAuditJson } from "@/lib/ndis-gateway/security/log-sanitiser";
import { prisma } from "@/lib/prisma";

export type CreateBillingBatchInput = {
  organisationId: string;
  billingRoute: NdisBillingRoute;
  billableItemIds: string[];
  createdById: string;
  idempotencyKey?: string | null;
};

export async function createBillingBatch(input: CreateBillingBatchInput) {
  if (input.idempotencyKey) {
    const existing = await prisma.ndisBillingBatch.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: { members: true },
    });
    if (existing) {
      return { batch: existing, idempotent: true, issues: [] as const };
    }
  }

  const items = await prisma.ndisBillableServiceItem.findMany({
    where: {
      organisationId: input.organisationId,
      id: { in: input.billableItemIds },
    },
  });

  if (items.length !== input.billableItemIds.length) {
    throw new Error("BILLABLE_ITEMS_NOT_FOUND");
  }

  const policy = evaluateBatchPolicy({
    billingRoute: input.billingRoute,
    members: items.map((i) => ({
      billableItemId: i.id,
      participantId: i.participantId,
      billingRoute: i.billingRoute,
      status: i.status,
      totalCents: i.totalCents,
      paymentHold: i.paymentHold,
    })),
  });
  if (!policy.ok) {
    return { batch: null, idempotent: false, issues: policy.issues };
  }

  // Enforce grouping shape (single participant for self/plan/private)
  const groups = groupBillableItemsForBatching(
    items.map((i) => ({
      id: i.id,
      participantId: i.participantId,
      billingRoute: i.billingRoute,
    }))
  );
  if (groups.length !== 1) {
    return {
      batch: null,
      idempotent: false,
      issues: [
        {
          code: "batch_grouping_split_required",
          message:
            "Selected items must form a single batch group for this route. Split by participant first.",
        },
      ],
    };
  }

  const fy = australianFinancialYear(new Date());
  const batchReference = await prisma.$transaction(async (tx) => {
    const allocated = await allocateDocumentNumber({
      organisationId: input.organisationId,
      documentKind: "portal_bulk_upload",
      prefix: "MAP-BATCH",
      financialYear: fy,
      tx,
    });
    return allocated.documentNumber;
  });

  const correlationId = createCorrelationId();
  const batch = await prisma.$transaction(async (tx) => {
    const created = await tx.ndisBillingBatch.create({
      data: {
        organisationId: input.organisationId,
        billingRoute: input.billingRoute,
        status: "ready",
        batchReference,
        createdById: input.createdById,
        idempotencyKey: input.idempotencyKey ?? null,
        metadataJson: sanitiseAuditJson({
          correlationId,
          itemCount: items.length,
        }) as Prisma.InputJsonValue,
        members: {
          create: items.map((i) => ({ billableItemId: i.id })),
        },
      },
      include: { members: true },
    });

    await tx.ndisWorkflowTransition.create({
      data: {
        organisationId: input.organisationId,
        entityType: "ndis_billing_batch",
        entityId: created.id,
        fromStatus: "none",
        toStatus: created.status,
        actorUserId: input.createdById,
        correlationId,
        metadataJson: sanitiseAuditJson({
          batchReference,
          billableItemIds: items.map((i) => i.id),
        }) as Prisma.InputJsonValue,
      },
    });

    return created;
  });

  return { batch, idempotent: false, issues: [] as const };
}
