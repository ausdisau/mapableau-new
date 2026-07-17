import type {
  AssuranceEvidenceClassification,
  AssuranceEvidenceType,
} from "@prisma/client";

import { checksumEvidencePayload } from "@/lib/assurance/evidence/evidence-checksum";
import { prisma } from "@/lib/prisma";

export async function attachAssuranceEvidence(params: {
  controlId: string;
  title: string;
  evidenceType: AssuranceEvidenceType;
  classification?: AssuranceEvidenceClassification;
  summary?: string;
  documentId?: string;
  storageUri?: string;
  expiresAt?: Date | null;
  collectedById?: string | null;
}) {
  const collectedAt = new Date();
  const checksumSha256 = checksumEvidencePayload({
    title: params.title,
    evidenceType: params.evidenceType,
    summary: params.summary,
    documentId: params.documentId,
    collectedAtIso: collectedAt.toISOString(),
  });

  const evidence = await prisma.assuranceEvidence.create({
    data: {
      controlId: params.controlId,
      title: params.title,
      evidenceType: params.evidenceType,
      classification: params.classification ?? "internal",
      summary: params.summary,
      documentId: params.documentId,
      storageUri: params.storageUri,
      expiresAt: params.expiresAt ?? null,
      collectedById: params.collectedById ?? null,
      collectedAt,
      checksumSha256,
      isCurrent: true,
    },
  });

  // Thin compat pointer on legacy SecurityEvidence
  await prisma.securityEvidence.create({
    data: {
      controlId: params.controlId,
      documentId: params.documentId,
      notes: params.summary ?? params.title,
      assuranceEvidenceId: evidence.id,
    },
  });

  return evidence;
}

export async function listAssuranceEvidence(params?: {
  controlId?: string;
  currentOnly?: boolean;
}) {
  return prisma.assuranceEvidence.findMany({
    where: {
      controlId: params?.controlId,
      isCurrent: params?.currentOnly === false ? undefined : true,
    },
    include: {
      control: { select: { id: true, controlCode: true, title: true } },
    },
    orderBy: { collectedAt: "desc" },
  });
}

export async function supersedeEvidence(params: {
  evidenceId: string;
  replacementId: string;
}) {
  return prisma.$transaction([
    prisma.assuranceEvidence.update({
      where: { id: params.evidenceId },
      data: { isCurrent: false, supersededById: params.replacementId },
    }),
    prisma.assuranceEvidence.update({
      where: { id: params.replacementId },
      data: { isCurrent: true },
    }),
  ]);
}
