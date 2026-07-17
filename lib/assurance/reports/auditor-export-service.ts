import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { assertClassificationAllowedForExport } from "@/lib/assurance/evidence/evidence-classification";
import { listAssuranceFrameworks } from "@/lib/assurance/frameworks/framework-service";
import { evaluateAssuranceReadiness } from "@/lib/assurance/readiness/evaluate-assurance-readiness";
import { projectAssuranceReadiness } from "@/lib/assurance/readiness/readiness-projection";
import { prisma } from "@/lib/prisma";

export async function exportAuditorBundle(params?: {
  organisationId?: string;
  outputDir?: string;
}) {
  const [frameworks, readiness, evidence, findings] = await Promise.all([
    listAssuranceFrameworks(),
    evaluateAssuranceReadiness({ organisationId: params?.organisationId }),
    prisma.assuranceEvidence.findMany({
      where: { isCurrent: true },
      select: {
        id: true,
        title: true,
        evidenceType: true,
        classification: true,
        collectedAt: true,
        expiresAt: true,
        checksumSha256: true,
        controlId: true,
      },
    }),
    prisma.securityFinding.findMany({
      where: {
        organisationId: params?.organisationId,
        status: { in: ["open", "in_remediation", "accepted_risk"] },
      },
      select: {
        id: true,
        title: true,
        severity: true,
        status: true,
        source: true,
      },
    }),
  ]);

  const exportableEvidence = evidence.filter((e) => {
    const check = assertClassificationAllowedForExport(e.classification);
    return check.allowed;
  });

  const payload = {
    generatedAt: new Date().toISOString(),
    organisationId: params?.organisationId ?? null,
    disclaimer:
      "Auditor export for internal readiness review. MapAble does not claim certification from this bundle.",
    readiness: projectAssuranceReadiness(readiness),
    frameworks: frameworks.map((f) => ({
      id: f.id,
      kind: f.kind,
      name: f.name,
      version: f.version,
      controlCount: f.controls.length,
    })),
    evidence: exportableEvidence,
    findings,
  };

  const dir = params?.outputDir ?? path.join(process.cwd(), "artifacts", "assurance");
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `auditor-bundle-${Date.now()}.json`);
  await writeFile(file, JSON.stringify(payload, null, 2), "utf8");
  return { file, payload };
}
