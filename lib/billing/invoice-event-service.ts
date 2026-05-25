import type { BillingEventType, InvoiceStatus } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function recordBillingEvent(params: {
  invoiceId: string;
  eventType: BillingEventType;
  fromStatus?: InvoiceStatus | null;
  toStatus?: InvoiceStatus | null;
  actorUserId?: string | null;
  message?: string;
  metadata?: Record<string, unknown>;
  participantId?: string;
  auditAction?: string;
}) {
  const event = await prisma.billingEvent.create({
    data: {
      invoiceId: params.invoiceId,
      eventType: params.eventType,
      fromStatus: params.fromStatus ?? undefined,
      toStatus: params.toStatus ?? undefined,
      actorUserId: params.actorUserId ?? undefined,
      message: params.message,
      metadata: params.metadata as object | undefined,
    },
  });

  if (params.auditAction) {
    await createAuditEvent({
      actorUserId: params.actorUserId ?? undefined,
      action: params.auditAction,
      entityType: "Invoice",
      entityId: params.invoiceId,
      participantId: params.participantId,
      metadata: params.metadata,
    });
  }

  return event;
}
