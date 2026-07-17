import type { NdiaEvidenceLinkageStatus } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { phase5Config } from "@/lib/config/phase5";
import { prisma } from "@/lib/prisma";

export type EvidenceLinkageEvaluation = {
  linkageStatus: NdiaEvidenceLinkageStatus;
  billableItemIds: string[];
  evidencePackageIds: string[];
  timesheetIds: string[];
  attestationIds: string[];
  canSupportApproval: boolean;
  reasons: string[];
};

/**
 * Exact Wave 4 billable-item / evidence-package linkage only.
 * Ambiguous or unsafe linkage cannot support approval.
 */
export function evaluateEvidenceLinkage(params: {
  invoiceId: string;
  organisationId: string | null;
  billableItems: Array<{
    id: string;
    organisationId: string;
    timesheetId: string | null;
    supersededById: string | null;
    status: string;
    evidencePackage: {
      id: string;
      timesheetId: string | null;
      status: string;
      supersededAt: Date | null;
      references: Array<{ referenceType: string; referenceId: string }>;
    } | null;
  }>;
}): EvidenceLinkageEvaluation {
  const reasons: string[] = [];

  if (!params.organisationId) {
    return {
      linkageStatus: "unsafe",
      billableItemIds: [],
      evidencePackageIds: [],
      timesheetIds: [],
      attestationIds: [],
      canSupportApproval: false,
      reasons: ["invoice_missing_organisation"],
    };
  }

  const orgItems = params.billableItems.filter(
    (b) => b.organisationId === params.organisationId
  );

  if (orgItems.length === 0) {
    return {
      linkageStatus: "unsafe",
      billableItemIds: [],
      evidencePackageIds: [],
      timesheetIds: [],
      attestationIds: [],
      canSupportApproval: false,
      reasons: ["no_billable_items_for_invoice_organisation"],
    };
  }

  const superseded = orgItems.filter((b) => !!b.supersededById);
  if (superseded.length === orgItems.length) {
    return {
      linkageStatus: "superseded",
      billableItemIds: superseded.map((b) => b.id),
      evidencePackageIds: [],
      timesheetIds: [],
      attestationIds: [],
      canSupportApproval: false,
      reasons: ["all_billable_items_superseded"],
    };
  }

  const active = orgItems.filter((b) => !b.supersededById && b.status !== "voided");
  const withPackages = active.filter((b) => b.evidencePackage);
  const withoutPackages = active.filter((b) => !b.evidencePackage);

  if (withoutPackages.length > 0 && withPackages.length > 0) {
    reasons.push("partial_evidence_package_coverage");
  }

  if (withPackages.length === 0) {
    return {
      linkageStatus: "unsafe",
      billableItemIds: active.map((b) => b.id),
      evidencePackageIds: [],
      timesheetIds: [],
      attestationIds: [],
      canSupportApproval: false,
      reasons: ["no_evidence_packages_linked_to_billable_items"],
    };
  }

  const timesheetIds = new Set<string>();
  const attestationIds = new Set<string>();
  const evidencePackageIds: string[] = [];
  let ambiguous = false;

  for (const item of withPackages) {
    const pkg = item.evidencePackage;
    if (!pkg) continue;
    if (pkg.supersededAt) {
      ambiguous = true;
      reasons.push(`evidence_package_superseded:${pkg.id}`);
      continue;
    }

    evidencePackageIds.push(pkg.id);

    const packageTimesheet = pkg.timesheetId ?? item.timesheetId;
    if (packageTimesheet) {
      timesheetIds.add(packageTimesheet);
    }

    const timesheetRefs = pkg.references.filter((r) => r.referenceType === "timesheet");
    for (const ref of timesheetRefs) {
      if (packageTimesheet && ref.referenceId !== packageTimesheet) {
        ambiguous = true;
        reasons.push(`timesheet_ref_mismatch:${ref.referenceId}`);
      } else {
        timesheetIds.add(ref.referenceId);
      }
    }

    for (const ref of pkg.references.filter((r) => r.referenceType === "attestation")) {
      attestationIds.add(ref.referenceId);
    }
  }

  if (ambiguous) {
    return {
      linkageStatus: "ambiguous",
      billableItemIds: withPackages.map((b) => b.id),
      evidencePackageIds,
      timesheetIds: [...timesheetIds],
      attestationIds: [...attestationIds],
      canSupportApproval: false,
      reasons,
    };
  }

  if (withoutPackages.length > 0) {
    return {
      linkageStatus: "partially_linked",
      billableItemIds: active.map((b) => b.id),
      evidencePackageIds,
      timesheetIds: [...timesheetIds],
      attestationIds: [...attestationIds],
      canSupportApproval: false,
      reasons: [...reasons, "not_all_billable_items_have_evidence_packages"],
    };
  }

  return {
    linkageStatus: "exact_match",
    billableItemIds: withPackages.map((b) => b.id),
    evidencePackageIds,
    timesheetIds: [...timesheetIds],
    attestationIds: [...attestationIds],
    canSupportApproval: true,
    reasons: ["exact_wave4_billable_evidence_linkage"],
  };
}

export async function buildEvidenceBundleFromInvoice(
  invoiceId: string,
  actorUserId: string
) {
  if (!phase5Config.ndiaReadinessEnabled) {
    throw new Error("NDIA_READINESS_DISABLED");
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      lines: true,
      booking: true,
    },
  });
  if (!invoice) throw new Error("NOT_FOUND");

  const organisationId = invoice.organisationId;
  if (!organisationId) {
    throw new Error("INVOICE_ORGANISATION_REQUIRED");
  }

  // Exact linkage via Wave 4 billing documents / booking — never participant-wide take:N.
  const documentLinked =
    invoice.invoiceNumber != null && invoice.invoiceNumber.length > 0
      ? await prisma.ndisBillableServiceItem.findMany({
          where: {
            organisationId,
            documentLines: {
              some: {
                document: {
                  organisationId,
                  documentNumber: invoice.invoiceNumber,
                },
              },
            },
          },
          include: {
            evidencePackage: {
              include: { references: true },
            },
          },
        })
      : [];

  const bookingLinked =
    invoice.bookingId != null
      ? await prisma.ndisBillableServiceItem.findMany({
          where: {
            organisationId,
            bookingId: invoice.bookingId,
            status: { not: "voided" },
          },
          include: {
            evidencePackage: {
              include: { references: true },
            },
          },
        })
      : [];

  const byId = new Map<string, (typeof documentLinked)[number]>();
  for (const item of [...documentLinked, ...bookingLinked]) {
    byId.set(item.id, item);
  }
  const scoped = [...byId.values()];

  const hasExactAnchor = scoped.length > 0;

  const linkage = evaluateEvidenceLinkage({
    invoiceId,
    organisationId,
    billableItems: scoped.map((b) => ({
      id: b.id,
      organisationId: b.organisationId,
      timesheetId: b.timesheetId,
      supersededById: b.supersededById,
      status: b.status,
      evidencePackage: b.evidencePackage
        ? {
            id: b.evidencePackage.id,
            timesheetId: b.evidencePackage.timesheetId,
            status: b.evidencePackage.status,
            supersededAt: b.evidencePackage.supersededAt,
            references: b.evidencePackage.references.map((r) => ({
              referenceType: r.referenceType,
              referenceId: r.referenceId,
            })),
          }
        : null,
    })),
  });

  let linkageStatus = linkage.linkageStatus;
  let canSupportApproval = linkage.canSupportApproval;
  const reasons = [...linkage.reasons];

  if (!hasExactAnchor && linkageStatus === "exact_match") {
    linkageStatus = "ambiguous";
    canSupportApproval = false;
    reasons.push("no_exact_invoice_billable_anchor");
  }

  const suggestions = await prisma.ndisLineItemSuggestion.findMany({
    where: { sourceType: "invoice", sourceId: invoiceId },
  });

  const references = {
    invoiceId,
    organisationId,
    lineCount: invoice.lines.length,
    bookingId: invoice.bookingId,
    billableItemIds: linkage.billableItemIds,
    evidencePackageIds: linkage.evidencePackageIds,
    timesheetIds: linkage.timesheetIds,
    attestationIds: linkage.attestationIds,
    suggestionIds: suggestions.map((s) => s.id),
    linkageStatus,
    canSupportApproval,
    linkageReasons: reasons,
    disclaimer:
      "Evidence bundle for review only — not submitted to NDIA or PACE. Ambiguous/unsafe linkage cannot support approval.",
  };

  const bundle = await prisma.ndiaClaimEvidenceBundle.create({
    data: {
      invoiceId,
      organisationId,
      billableItemIds: linkage.billableItemIds,
      linkageStatus,
      referencesJson: references,
      status: canSupportApproval ? "draft" : "needs_linkage_review",
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "ndia.bundle_created",
    entityType: "NdiaClaimEvidenceBundle",
    entityId: bundle.id,
    participantId: invoice.participantId,
  });

  return bundle;
}

export async function runNdiaDryRun(bundleId: string, actorUserId: string) {
  if (phase5Config.ndiaRealSubmissionEnabled) {
    throw new Error("REAL_SUBMISSION_DISABLED_IN_PHASE_5");
  }

  const bundle = await prisma.ndiaClaimEvidenceBundle.findUnique({
    where: { id: bundleId },
  });
  if (!bundle) throw new Error("NOT_FOUND");

  const findings: string[] = [];
  if (
    bundle.linkageStatus === "ambiguous" ||
    bundle.linkageStatus === "unsafe" ||
    bundle.linkageStatus === "superseded"
  ) {
    findings.push(
      `Linkage status ${bundle.linkageStatus} cannot support approval or submission readiness`
    );
  }
  if (bundle.billableItemIds.length === 0) {
    findings.push("No exactly linked billable item ids");
  }

  const refs = bundle.referencesJson as Record<string, unknown>;
  if (!refs.evidencePackageIds || (refs.evidencePackageIds as string[]).length === 0) {
    findings.push("No Wave 4 evidence packages linked");
  }

  const dryRun = await prisma.ndiaSubmissionDryRun.create({
    data: {
      bundleId,
      result: findings.length ? "review_required" : "passed_placeholder",
      findingsJson: findings,
    },
  });

  await prisma.ndiaIntegrationAudit.create({
    data: {
      bundleId,
      action: "dry_run",
      actorId: actorUserId,
    },
  });

  return {
    dryRun,
    notSubmitted: true,
    linkageStatus: bundle.linkageStatus,
    canSupportApproval: bundle.linkageStatus === "exact_match",
    message: "Not submitted to NDIA — dry run validation only.",
  };
}

export async function exportEvidenceBundle(bundleId: string, actorUserId: string) {
  const bundle = await prisma.ndiaClaimEvidenceBundle.findUnique({
    where: { id: bundleId },
  });
  if (!bundle) throw new Error("NOT_FOUND");

  await prisma.ndiaIntegrationAudit.create({
    data: { bundleId, action: "export", actorId: actorUserId },
  });

  await createAuditEvent({
    actorUserId,
    action: "ndia.bundle_exported",
    entityType: "NdiaClaimEvidenceBundle",
    entityId: bundleId,
  });

  return {
    bundleId,
    exportFormat: "json",
    linkageStatus: bundle.linkageStatus,
    payload: bundle.referencesJson,
    disclaimer: "Manual export only — not submitted to NDIA.",
  };
}
