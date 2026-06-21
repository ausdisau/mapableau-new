import { format } from "date-fns";

import { recordUsageEvent } from "@/lib/usage/usage-ledger";
import { prisma } from "@/lib/prisma";

import { logAbilityPayEvent } from "./audit";
import { canExportClaimPack } from "./entitlements";
import { getPlanWalletSummary } from "./plan-service";

export async function exportClaimPackCsv(params: {
  userId: string;
  invoiceIds?: string[];
  planId?: string;
  organisationId?: string;
}) {
  const gate = await canExportClaimPack(params.userId);
  if (!gate.allowed) {
    throw new Error(gate.reason ?? "EXPORT_QUOTA_EXCEEDED");
  }

  const where = params.invoiceIds?.length
    ? { id: { in: params.invoiceIds } }
    : params.planId
      ? { planId: params.planId, status: "approved" as const }
      : { status: "approved" as const };

  const invoices = await prisma.abilityPayInvoice.findMany({
    where,
    include: {
      provider: true,
      lineItems: true,
      participant: { select: { name: true, email: true } },
    },
    take: 200,
  });

  const header = [
    "invoice_id",
    "invoice_number",
    "participant_name",
    "provider_name",
    "provider_abn",
    "status",
    "total_cents",
    "issue_date",
    "line_description",
    "line_service_date",
    "line_support_item",
    "line_unit_price_cents",
    "line_total_cents",
    "validation_passed",
  ].join(",");

  const rows: string[] = [header];
  for (const inv of invoices) {
    const validation = inv.validationJson as { passed?: boolean } | null;
    const validationPassed = validation?.passed ?? false;
    for (const line of inv.lineItems) {
      rows.push(
        [
          inv.id,
          inv.invoiceNumber ?? "",
          `"${(inv.participant.name ?? "").replace(/"/g, '""')}"`,
          `"${(inv.provider?.legalName ?? "").replace(/"/g, '""')}"`,
          inv.provider?.abn ?? "",
          inv.status,
          inv.totalCents,
          inv.issueDate ? format(inv.issueDate, "yyyy-MM-dd") : "",
          `"${line.description.replace(/"/g, '""')}"`,
          format(line.serviceDate, "yyyy-MM-dd"),
          line.supportItemCode ?? "",
          line.unitPriceCents,
          line.totalCents,
          validationPassed,
        ].join(",")
      );
    }
  }

  const csv = rows.join("\n");
  const fileName = `abilitypay-claim-pack-${Date.now()}.csv`;

  const pack = await prisma.abilityPayClaimPack.create({
    data: {
      createdById: params.userId,
      planId: params.planId,
      organisationId: params.organisationId,
      format: "csv",
      fileName,
      rowCount: invoices.length,
      billingStatus: "metered",
      metadata: { invoiceCount: invoices.length },
    },
  });

  if (params.invoiceIds?.length) {
    await prisma.abilityPayInvoice.updateMany({
      where: { id: { in: params.invoiceIds } },
      data: { status: "exported" },
    });
  } else if (params.planId) {
    await prisma.abilityPayInvoice.updateMany({
      where: { id: { in: invoices.map((i) => i.id) } },
      data: { status: "exported" },
    });
  }

  await recordUsageEvent({
    category: "export",
    eventType: "abilitypay.claim_pack",
    userId: params.userId,
    organisationId: params.organisationId,
    entityType: "AbilityPayClaimPack",
    entityId: pack.id,
    metadata: { format: "csv", invoiceCount: invoices.length },
  });

  await logAbilityPayEvent({
    action: "abilitypay.export.csv",
    entityType: "AbilityPayClaimPack",
    entityId: pack.id,
    actorUserId: params.userId,
    metadata: { rowCount: invoices.length, fileName },
  });

  return { csv, fileName, pack, remainingExports: gate.remaining - 1 };
}

export async function generateMonthlyStatement(params: {
  userId: string;
  planId: string;
  month: string;
  organisationId?: string;
}) {
  const gate = await canExportClaimPack(params.userId);
  if (!gate.allowed) {
    throw new Error(gate.reason ?? "EXPORT_QUOTA_EXCEEDED");
  }

  const [year, monthNum] = params.month.split("-").map(Number);
  const start = new Date(year, monthNum - 1, 1);
  const end = new Date(year, monthNum, 0, 23, 59, 59);

  const summary = await getPlanWalletSummary(params.planId);
  if (!summary) throw new Error("PLAN_NOT_FOUND");

  const invoices = await prisma.abilityPayInvoice.findMany({
    where: {
      planId: params.planId,
      status: { in: ["approved", "exported"] },
      updatedAt: { gte: start, lte: end },
    },
    include: { provider: true, lineItems: true },
    orderBy: { updatedAt: "asc" },
  });

  const categoryTotals = summary.plan.categories.map((cat) => ({
    name: cat.name,
    allocatedCents: cat.allocatedCents,
    spentCents: cat.spentCents,
    remainingCents: cat.allocatedCents - cat.spentCents,
  }));

  const html = `<!DOCTYPE html>
<html lang="en-AU">
<head>
  <meta charset="utf-8" />
  <title>AbilityPay statement — ${params.month}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 48rem; margin: 2rem auto; color: #1a1a2e; line-height: 1.6; }
    h1 { font-size: 1.5rem; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { text-align: left; padding: 0.5rem; border-bottom: 1px solid #e2e8f0; }
    th { background: #f8fafc; }
    .muted { color: #64748b; font-size: 0.875rem; }
    @media print { body { margin: 1rem; } }
  </style>
</head>
<body>
  <h1>Your support spending statement</h1>
  <p class="muted">${format(start, "MMMM yyyy")} · ${summary.plan.title}</p>
  <p>This statement shows approved invoices for your NDIS plan. It is for your records only.</p>

  <h2>Plan wallet</h2>
  <table>
    <caption class="muted">Budget summary by category</caption>
    <thead><tr><th scope="col">Category</th><th scope="col">Allocated</th><th scope="col">Spent</th><th scope="col">Remaining</th></tr></thead>
    <tbody>
      ${categoryTotals
        .map(
          (c) =>
            `<tr><td>${c.name}</td><td>$${(c.allocatedCents / 100).toFixed(2)}</td><td>$${(c.spentCents / 100).toFixed(2)}</td><td>$${(c.remainingCents / 100).toFixed(2)}</td></tr>`
        )
        .join("")}
    </tbody>
  </table>

  <h2>Approved invoices this month</h2>
  <table>
    <caption class="muted">Invoices approved in ${format(start, "MMMM yyyy")}</caption>
    <thead><tr><th scope="col">Date</th><th scope="col">Provider</th><th scope="col">Amount</th><th scope="col">Invoice #</th></tr></thead>
    <tbody>
      ${
        invoices.length === 0
          ? "<tr><td colspan=\"4\">No approved invoices this month.</td></tr>"
          : invoices
              .map(
                (inv) =>
                  `<tr><td>${inv.issueDate ? format(inv.issueDate, "dd MMM yyyy") : "—"}</td><td>${inv.provider?.legalName ?? "—"}</td><td>$${(inv.totalCents / 100).toFixed(2)}</td><td>${inv.invoiceNumber ?? "—"}</td></tr>`
              )
              .join("")
      }
    </tbody>
  </table>
  <p class="muted">Generated by AbilityPay · MapAble Core. Not an official NDIS document.</p>
</body>
</html>`;

  const fileName = `abilitypay-statement-${params.month}.html`;

  const pack = await prisma.abilityPayClaimPack.create({
    data: {
      createdById: params.userId,
      planId: params.planId,
      organisationId: params.organisationId,
      format: "html_statement",
      fileName,
      rowCount: invoices.length,
      billingStatus: "metered",
      metadata: { month: params.month },
    },
  });

  if (invoices.length > 0) {
    await prisma.abilityPayInvoice.updateMany({
      where: { id: { in: invoices.map((i) => i.id) } },
      data: { status: "exported" },
    });
  }

  await recordUsageEvent({
    category: "export",
    eventType: "abilitypay.claim_pack",
    userId: params.userId,
    organisationId: params.organisationId,
    entityType: "AbilityPayClaimPack",
    entityId: pack.id,
    metadata: { format: "html_statement", month: params.month },
  });

  await logAbilityPayEvent({
    action: "abilitypay.export.statement",
    entityType: "AbilityPayClaimPack",
    entityId: pack.id,
    actorUserId: params.userId,
    participantId: summary.plan.participantId,
    metadata: { month: params.month, invoiceCount: invoices.length },
  });

  return {
    html,
    fileName,
    pack,
    invoiceCount: invoices.length,
    remainingExports: gate.remaining - 1,
  };
}
