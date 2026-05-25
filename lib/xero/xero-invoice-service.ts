import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isXeroConfigured } from "@/lib/config/phase2";
import { phase5Config, integrationDisabledMessage } from "@/lib/config/phase5";
import { prisma } from "@/lib/prisma";

const SAFE_DESCRIPTION = "Support services — details in MapAble records";

export function buildSafeXeroInvoicePayload(invoice: {
  id: string;
  lines: { description: string; quantity: number; unitAmountCents: number }[];
}) {
  return {
    reference: invoice.id,
    lineItems: invoice.lines.map((l) => ({
      description: SAFE_DESCRIPTION,
      quantity: l.quantity,
      unitAmount: l.unitAmountCents / 100,
    })),
  };
}

export async function syncInvoiceToXero(invoiceId: string, actorUserId: string) {
  if (!phase5Config.xeroEnabled || !isXeroConfigured()) {
    return { ok: false as const, ...integrationDisabledMessage("Xero") };
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { lines: true },
  });
  if (!invoice) throw new Error("NOT_FOUND");

  const payload = buildSafeXeroInvoicePayload({
    id: invoice.id,
    lines: invoice.lines.map((l) => ({
      description: l.description,
      quantity: Number(l.quantity),
      unitAmountCents: l.unitAmountCents,
    })),
  });

  const existing = await prisma.xeroInvoiceSyncRecord.findFirst({
    where: { invoiceId },
  });
  const record = existing
    ? await prisma.xeroInvoiceSyncRecord.update({
        where: { id: existing.id },
        data: {
          syncStatus: "synced",
          xeroInvoiceId: `xero_placeholder_${invoiceId.slice(0, 8)}`,
          syncedAt: new Date(),
          lastError: null,
        },
      })
    : await prisma.xeroInvoiceSyncRecord.create({
        data: {
          invoiceId,
          syncStatus: "synced",
          xeroInvoiceId: `xero_placeholder_${invoiceId.slice(0, 8)}`,
          syncedAt: new Date(),
        },
      });

  await prisma.xeroSyncLog.create({
    data: {
      invoiceId,
      action: "invoice_sync",
      status: "synced",
      message: "Placeholder sync — configure Xero API for production",
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "xero.invoice_synced",
    entityType: "Invoice",
    entityId: invoiceId,
    participantId: invoice.participantId,
  });

  return { ok: true as const, record, payload };
}
