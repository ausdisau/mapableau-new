import type { AssuranceControlStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function listControls(params?: {
  frameworkId?: string;
  status?: AssuranceControlStatus;
}) {
  return prisma.securityControl.findMany({
    where: {
      frameworkId: params?.frameworkId,
      assuranceStatus: params?.status,
    },
    include: {
      framework: { select: { id: true, name: true, kind: true } },
      assuranceEvidence: { where: { isCurrent: true }, take: 5 },
    },
    orderBy: { controlCode: "asc" },
  });
}

export async function getControl(controlId: string) {
  return prisma.securityControl.findUnique({
    where: { id: controlId },
    include: {
      framework: true,
      assuranceEvidence: { orderBy: { collectedAt: "desc" } },
      tests: { include: { runs: { orderBy: { executedAt: "desc" }, take: 5 } } },
      exceptions: { orderBy: { createdAt: "desc" } },
      mappings: true,
      findings: { where: { status: { in: ["open", "in_remediation"] } } },
    },
  });
}

export async function updateControlStatus(params: {
  controlId: string;
  assuranceStatus: AssuranceControlStatus;
  assessedById?: string | null;
}) {
  const nextAssessmentAt =
    params.assuranceStatus === "operating"
      ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      : null;

  return prisma.securityControl.update({
    where: { id: params.controlId },
    data: {
      assuranceStatus: params.assuranceStatus,
      status: params.assuranceStatus,
      lastAssessedAt: new Date(),
      nextAssessmentAt,
      reviewerId: params.assessedById ?? undefined,
    },
  });
}

export async function mapControl(params: {
  controlId: string;
  targetFrameworkKind: Parameters<
    typeof prisma.assuranceControlMapping.create
  >[0]["data"]["targetFrameworkKind"];
  targetControlCode: string;
  mappingNotes?: string;
}) {
  return prisma.assuranceControlMapping.create({
    data: {
      controlId: params.controlId,
      targetFrameworkKind: params.targetFrameworkKind,
      targetControlCode: params.targetControlCode,
      mappingNotes: params.mappingNotes,
    },
  });
}
