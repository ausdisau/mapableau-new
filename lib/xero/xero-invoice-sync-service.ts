import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { recordBillingEvent } from "@/lib/billing/invoice-event-service";
import { phase5Config, integrationDisabledMessage } from "@/lib/config/phase5";
import { prisma } from "@/lib/prisma";
import { resolveXeroContactId } from "@/lib/xero/xero-contact-service";
import { mapInvoiceToXeroPayload } from "@/lib/xero/xero-invoice-mapper";
import { hashXeroPayload } from "@/lib/xero/xero-oauth-service";
import { enqueueXeroSync } from "@/lib/xero/xero-sync-queue";
import { getValidXeroAccessToken } from "@/lib/xero/xero-token-service";
import { createXeroInvoice } from "@/lib/xero/xero-client";

export async function syncInvoiceToXeroAccounting(
  invoiceId: string,
  actorUserId: string,
  organisationId: string
) {
  if (!phase5Config.xeroEnabled) {
    return { ok: false as const, ...integrationDisabledMessage("Xero") };
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { lines: true, participant: true },
  });
  if (!invoice) throw new Error("INVOICE_NOT_FOUND");
  if (!invoice.organisationId || invoice.organisationId !== organisationId) {
    throw new Error("ORG_MISMATCH");
  }

  const synced = await prisma.xeroInvoiceSyncRecord.findFirst({
    where: { invoiceId, syncStatus: "synced", xeroInvoiceId: { not: null } },
  });
  if (synced?.xeroInvoiceId) {
    return { ok: true as const, duplicate: true, record: synced };
  }

  const contactName =
    invoice.participant.name ?? `Participant ${invoice.participantId.slice(0, 6)}`;
  const xeroContactId = await resolveXeroContactId({
    participantId: invoice.participantId,
    organisationId: invoice.organisationId,
    contactName,
  });

  const payload = mapInvoiceToXeroPayload({
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    contactName,
    xeroContactId,
    lines: invoice.lines.map((l) => ({
      description: l.description,
      quantity: Number(l.quantity),
      unitAmountCents: l.unitAmountCents,
      xeroAccountCode: l.xeroAccountCode,
      xeroTaxType: l.xeroTaxType,
    })),
  });

  const payloadHash = hashXeroPayload(payload);
  const prior = await prisma.xeroInvoiceSyncRecord.findFirst({
    where: { invoiceId, payloadHash, syncStatus: "synced" },
  });
  if (prior?.xeroInvoiceId) {
    return { ok: true as const, duplicate: true, record: prior };
  }

  const attempt =
    (await prisma.xeroInvoiceSyncRecord.count({ where: { invoiceId } })) + 1;
  let syncRecord = await enqueueXeroSync(invoiceId, organisationId);
  syncRecord = await prisma.xeroInvoiceSyncRecord.update({
    where: { id: syncRecord.id },
    data: { syncStatus: "syncing", attemptNumber: attempt, payloadHash },
  });

  await recordBillingEvent({
    invoiceId,
    eventType: "xero_sync_started",
    actorUserId,
    participantId: invoice.participantId,
    auditAction: "xero.sync_started",
  });

  try {
    const { accessToken, tenantId } = await getValidXeroAccessToken(organisationId);
    const result = await createXeroInvoice(accessToken, tenantId, payload);
    const xeroInvoiceId = result.Invoices?.[0]?.InvoiceID;
    if (!xeroInvoiceId) throw new Error("XERO_NO_INVOICE_ID");

    syncRecord = await prisma.xeroInvoiceSyncRecord.update({
      where: { id: syncRecord.id },
      data: {
        syncStatus: "synced",
        xeroInvoiceId,
        syncedAt: new Date(),
        lastError: null,
      },
    });

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "xero_synced" },
    });

    await recordBillingEvent({
      invoiceId,
      eventType: "xero_synced",
      toStatus: "xero_synced",
      actorUserId,
      participantId: invoice.participantId,
      auditAction: "xero.invoice_synced",
      metadata: { xeroInvoiceId },
    });

    await createAuditEvent({
      actorUserId,
      action: "xero.invoice_synced",
      entityType: "Invoice",
      entityId: invoiceId,
      participantId: invoice.participantId,
    });

    return { ok: true as const, record: syncRecord, payload };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    syncRecord = await prisma.xeroInvoiceSyncRecord.update({
      where: { id: syncRecord.id },
      data: { syncStatus: "failed", lastError: message },
    });

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "xero_sync_pending" },
    });

    await recordBillingEvent({
      invoiceId,
      eventType: "xero_sync_failed",
      actorUserId,
      participantId: invoice.participantId,
      auditAction: "xero.sync_failed",
      message,
    });

    return { ok: false as const, record: syncRecord, error: message };
  }
}

export async function getXeroInvoiceSyncStatus(invoiceId: string) {
  const record = await prisma.xeroInvoiceSyncRecord.findFirst({
    where: { invoiceId },
    orderBy: { createdAt: "desc" },
  });
  return {
    status: record?.syncStatus ?? "not_started",
    record,
    canRetry: record?.syncStatus === "failed",
  };
}
