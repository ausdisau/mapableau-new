import type { Prisma } from "@prisma/client";

import { projectBillableItemSafe } from "@/lib/ndis-gateway/billing/billable-item-service";
import { assertBillableItemTransition } from "@/lib/ndis-gateway/workflows/billable-item-state-machine";
import { createCorrelationId } from "@/lib/ndis-gateway/infrastructure/correlation";
import { sanitiseAuditJson } from "@/lib/ndis-gateway/security/log-sanitiser";
import { prisma } from "@/lib/prisma";

export async function voidPaymentWorkflow(input: {
  organisationId: string;
  actorUserId: string;
  billableItemId: string;
  reason: string;
}) {
  if (!input.reason.trim()) throw new Error("VOID_REASON_REQUIRED");

  const item = await prisma.ndisBillableServiceItem.findFirst({
    where: {
      id: input.billableItemId,
      organisationId: input.organisationId,
    },
  });
  if (!item) throw new Error("BILLABLE_ITEM_NOT_FOUND");

  assertBillableItemTransition(item.status, "voided");

  const correlationId = createCorrelationId();
  const updated = await prisma.ndisBillableServiceItem.update({
    where: { id: item.id },
    data: {
      status: "voided",
      voidedAt: new Date(),
      voidReason: input.reason.trim(),
    },
  });

  await prisma.ndisWorkflowTransition.create({
    data: {
      organisationId: input.organisationId,
      entityType: "ndis_billable_service_item",
      entityId: item.id,
      fromStatus: item.status,
      toStatus: "voided",
      actorUserId: input.actorUserId,
      reason: input.reason.trim(),
      correlationId,
      metadataJson: sanitiseAuditJson({
        action: "void_payment_workflow",
      }) as Prisma.InputJsonValue,
    },
  });

  return {
    correlationId,
    item: projectBillableItemSafe(updated),
  };
}
