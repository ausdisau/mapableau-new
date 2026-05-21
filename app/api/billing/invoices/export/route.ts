import { NextResponse } from "next/server";

import { createAuditLog } from "@/lib/billing/audit";
import { requireAuthUserId, isAuthError } from "@/lib/billing/auth";
import { invoiceToCsv, invoiceToPlanManagerPayload } from "@/lib/billing/export";
import { prisma } from "@/lib/prisma";
import { invoiceExportSchema } from "@/schemas/billing.types";

export async function POST(request: Request) {
  const authResult = await requireAuthUserId();
  if (isAuthError(authResult)) return authResult;
  const { userId } = authResult;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = invoiceExportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: parsed.data.invoiceId, userId },
    include: { lineItems: true, fundingSource: true },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (parsed.data.format === "xero") {
    return NextResponse.json(
      {
        error: "Xero export is not yet implemented",
        scaffold: true,
        invoiceId: invoice.id,
      },
      { status: 501 }
    );
  }

  const before = {
    xeroExportStatus: invoice.xeroExportStatus,
    planManagerExportStatus: invoice.planManagerExportStatus,
    status: invoice.status,
  };

  if (parsed.data.format === "csv") {
    const csv = invoiceToCsv(invoice);
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: invoice.status === "draft" ? "exported" : invoice.status,
        xeroExportStatus: "csv_exported",
      },
    });
    await createAuditLog({
      actorUserId: userId,
      entityType: "Invoice",
      entityId: invoice.id,
      action: "exported_csv",
      before,
      after: { xeroExportStatus: "csv_exported" },
    });
    return NextResponse.json({
      format: "csv",
      content: csv,
      filename: `invoice-${invoice.id}.csv`,
    });
  }

  const payload = invoiceToPlanManagerPayload(invoice);
  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: invoice.status === "draft" ? "exported" : invoice.status,
      planManagerExportStatus: "ready",
    },
  });
  await createAuditLog({
    actorUserId: userId,
    entityType: "Invoice",
    entityId: invoice.id,
    action: "exported_plan_manager",
    before,
    after: { planManagerExportStatus: "ready" },
  });

  return NextResponse.json({
    format: "plan_manager",
    payload,
    emailReady: Boolean(invoice.fundingSource?.planManagerEmail),
    suggestedRecipient: invoice.fundingSource?.planManagerEmail ?? null,
  });
}
