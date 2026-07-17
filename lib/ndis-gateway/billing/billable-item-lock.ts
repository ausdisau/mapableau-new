import type { Prisma } from "@prisma/client";

import { projectBillableItemSafe } from "@/lib/ndis-gateway/billing/billable-item-service";
import { createCorrelationId } from "@/lib/ndis-gateway/infrastructure/correlation";
import { sanitiseAuditJson } from "@/lib/ndis-gateway/security/log-sanitiser";
import { prisma } from "@/lib/prisma";

const LOCKABLE_STATUSES = ["ready", "evidence_pending"] as const;

export async function lockBillableItem(input: {
  organisationId: string;
  billableItemId: string;
  actorUserId: string;
  reason?: string | null;
}) {
  const item = await prisma.ndisBillableServiceItem.findFirst({
    where: {
      id: input.billableItemId,
      organisationId: input.organisationId,
    },
  });
  if (!item) throw new Error("BILLABLE_ITEM_NOT_FOUND");
  if (item.status === "locked") {
    return { item: projectBillableItemSafe(item), alreadyLocked: true };
  }
  if (
    !(LOCKABLE_STATUSES as readonly string[]).includes(item.status) &&
    item.status !== "ready"
  ) {
    throw new Error(`BILLABLE_ITEM_NOT_LOCKABLE:${item.status}`);
  }
  if (item.paymentHold) {
    throw new Error("BILLABLE_ITEM_PAYMENT_HOLD");
  }

  const updated = await prisma.ndisBillableServiceItem.update({
    where: { id: item.id },
    data: {
      status: "locked",
      lockedAt: new Date(),
      lockedById: input.actorUserId,
    },
  });

  await prisma.ndisWorkflowTransition.create({
    data: {
      organisationId: input.organisationId,
      entityType: "ndis_billable_service_item",
      entityId: item.id,
      fromStatus: item.status,
      toStatus: "locked",
      actorUserId: input.actorUserId,
      reason: input.reason ?? null,
      correlationId: createCorrelationId(),
      metadataJson: sanitiseAuditJson({
        action: "billable_item.locked",
      }) as Prisma.InputJsonValue,
    },
  });

  return { item: projectBillableItemSafe(updated), alreadyLocked: false };
}
