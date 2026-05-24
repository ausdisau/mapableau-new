import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { validateInvoiceLine } from "@/lib/ndis-pricing/invoice-line-validator";
import {
  buildValidationSummary,
  explainWarning,
} from "@/lib/ndis-pricing/plain-language-pricing-explainer";
import { prisma } from "@/lib/prisma";
import type { ClaimValidationResult } from "@/types/ndis-pricing";
import { NDIS_DISCLAIMER } from "@/types/ndis-pricing";
import type { NdisClaimFindingAudience, NdisClaimFindingSeverity } from "@prisma/client";

export async function runInvoiceClaimValidation(
  invoiceId: string,
  actorUserId: string,
  organisationId?: string | null
): Promise<ClaimValidationResult> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { lines: true },
  });

  if (!invoice) throw new Error("INVOICE_NOT_FOUND");

  const run = await prisma.ndisClaimValidationRun.create({
    data: {
      invoiceId,
      status: "pending",
      createdById: actorUserId,
      organisationId: organisationId ?? invoice.organisationId,
    },
  });

  let warningsCount = 0;
  let errorsCount = 0;
  const findingRecords: Array<{
    code: string;
    severity: NdisClaimFindingSeverity;
    audience: NdisClaimFindingAudience;
    plainMessage: string | null;
    technicalMessage: string;
    invoiceLineId: string | null;
    supportItemCode: string | null;
  }> = [];

  if (invoice.lines.length === 0) {
    findingRecords.push({
      code: "no_invoice_lines",
      severity: "warning",
      audience: "provider",
      plainMessage: "This invoice has no line items to check yet.",
      technicalMessage: "Invoice has zero lines",
      invoiceLineId: null,
      supportItemCode: null,
    });
    warningsCount += 1;
  }

  for (const line of invoice.lines) {
    const result = await validateInvoiceLine(
      {
        supportItemCode: line.supportItemCode,
        description: line.description,
        quantity: Number(line.quantity),
        unitAmountCents: line.unitAmountCents,
        totalAmountCents: line.totalAmountCents,
        claimableByNdis: line.claimableByNdis,
        serviceDate: line.serviceDate.toISOString(),
      },
      "provider"
    );

    for (const w of result.warnings) {
      if (w.severity === "error") errorsCount += 1;
      else warningsCount += 1;

      findingRecords.push({
        code: w.code,
        severity: w.severity as NdisClaimFindingSeverity,
        audience: "provider",
        plainMessage: explainWarning(w, "participant"),
        technicalMessage: w.technicalMessage ?? w.message,
        invoiceLineId: line.id,
        supportItemCode: line.supportItemCode,
      });

      findingRecords.push({
        code: `${w.code}_admin`,
        severity: w.severity as NdisClaimFindingSeverity,
        audience: "admin",
        plainMessage: null,
        technicalMessage: w.technicalMessage ?? w.message,
        invoiceLineId: line.id,
        supportItemCode: line.supportItemCode,
      });
    }
  }

  const summary = buildValidationSummary(warningsCount, errorsCount, "provider");

  await prisma.ndisClaimValidationFinding.createMany({
    data: findingRecords.map((f) => ({ ...f, runId: run.id })),
  });

  const completed = await prisma.ndisClaimValidationRun.update({
    where: { id: run.id },
    data: {
      status: "completed",
      summary,
      warningsCount,
      errorsCount,
      completedAt: new Date(),
    },
    include: { findings: true },
  });

  await createAuditEvent({
    actorUserId,
    action: "ndis_pricing.claim_validation_run",
    entityType: "NdisClaimValidationRun",
    entityId: run.id,
    metadata: { invoiceId, warningsCount, errorsCount },
  });

  return {
    runId: completed.id,
    invoiceId,
    status: "completed",
    summary,
    disclaimer: NDIS_DISCLAIMER,
    warningsCount,
    errorsCount,
    findings: completed.findings.map((f) => ({
      code: f.code,
      severity: f.severity,
      audience: f.audience,
      plainMessage: f.plainMessage,
      technicalMessage: f.technicalMessage,
      invoiceLineId: f.invoiceLineId,
      supportItemCode: f.supportItemCode,
    })),
  };
}
