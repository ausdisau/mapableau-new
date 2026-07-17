import type { SecurityFrameworkType } from "@prisma/client";

import { attachAssuranceEvidence } from "@/lib/assurance/evidence/evidence-service";
import { seedAssuranceFrameworks } from "@/lib/assurance/frameworks/framework-service";
import { phase5Config } from "@/lib/config/phase5";
import { prisma } from "@/lib/prisma";

/**
 * Legacy security-readiness entrypoints — delegate to Wave 6 assurance services.
 */
export async function ensureSecurityFrameworks() {
  if (!phase5Config.securityReadinessEnabled) return [];

  const seeded = await seedAssuranceFrameworks();
  if (seeded.frameworks.length > 0) {
    return seeded.frameworks;
  }

  // Backward-compatible minimal ensure for SOC2/ISO if catalogues disabled.
  const types: SecurityFrameworkType[] = ["soc2", "iso27001"];
  const results = [];
  for (const type of types) {
    const existing = await prisma.securityFramework.findFirst({
      where: { type },
    });
    const fw =
      existing ??
      (await prisma.securityFramework.create({
        data: {
          type,
          kind: type === "soc2" ? "soc2_readiness" : "iso27001_readiness",
          name: type === "soc2" ? "SOC 2 readiness" : "ISO 27001 readiness",
        },
      }));
    results.push(fw);
  }
  return results;
}

export async function mapControlToEvidence(
  controlId: string,
  documentId?: string,
  notes?: string
) {
  const assurance = await attachAssuranceEvidence({
    controlId,
    title: notes ?? "Legacy evidence mapping",
    evidenceType: "other",
    classification: "internal",
    summary: notes,
    documentId,
  });

  return prisma.securityEvidence.findFirst({
    where: { assuranceEvidenceId: assurance.id },
  });
}

export async function recordVendorRisk(params: {
  vendor: string;
  riskLevel: string;
  notes?: string;
  organisationId?: string;
  vendorCategory?: string;
}) {
  return prisma.vendorRiskAssessment.create({
    data: {
      vendor: params.vendor,
      riskLevel: params.riskLevel,
      notes: params.notes,
      organisationId: params.organisationId,
      vendorCategory: params.vendorCategory,
      status: "draft",
    },
  });
}
