import type { SecurityFrameworkType } from "@prisma/client";

import { phase5Config } from "@/lib/config/phase5";
import { prisma } from "@/lib/prisma";

export async function ensureSecurityFrameworks() {
  if (!phase5Config.securityReadinessEnabled) return [];

  const frameworks: { type: SecurityFrameworkType; name: string }[] = [
    { type: "soc2", name: "SOC 2 Type II readiness" },
    { type: "internal", name: "IRAP / ISM readiness" },
    { type: "iso27001", name: "ISO 27001 readiness" },
    { type: "privacy_act", name: "Privacy Act / APP readiness" },
    { type: "ndis_quality_safeguards", name: "NDIS Quality & Safeguards readiness" },
  ];
  const results = [];
  for (const fwDef of frameworks) {
    const existing = await prisma.securityFramework.findFirst({
      where: { type: fwDef.type, name: fwDef.name },
    });
    const fw =
      existing ??
      (await prisma.securityFramework.create({
        data: { type: fwDef.type, name: fwDef.name, active: true },
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
  return prisma.securityEvidence.create({
    data: { controlId, documentId, notes },
  });
}

export async function recordVendorRisk(params: {
  vendor: string;
  riskLevel: string;
  notes?: string;
}) {
  return prisma.vendorRiskAssessment.create({ data: params });
}
