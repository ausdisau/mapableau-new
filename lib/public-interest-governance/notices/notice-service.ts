import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type NoticeFields = {
  plainLanguage: string;
  easyRead: string;
  detailedNotice: string;
  machineReadable: Prisma.InputJsonValue;
};

export type EvidenceBackedReason = {
  label: string;
  reason: string;
  evidenceRef: string;
};

export function noticeIsComplete(fields: NoticeFields): boolean {
  return (
    fields.plainLanguage.trim().length > 0 &&
    fields.easyRead.trim().length > 0 &&
    fields.detailedNotice.trim().length > 0 &&
    fields.machineReadable !== null
  );
}

export function buildDecisionNotice(params: {
  title: string;
  summary: string;
  effectOnPerson?: string;
  appealHowTo: string;
  appealDeadlineAt?: Date;
  evidenceBackedReasons: EvidenceBackedReason[];
}): NoticeFields {
  if (params.evidenceBackedReasons.length === 0) {
    throw new Error("NOTICE_REQUIRES_EVIDENCE_BACKED_REASONS");
  }

  const reasonLines = params.evidenceBackedReasons.map(
    (reason) => `- ${reason.reason} (evidence: ${reason.label})`,
  );
  const effect =
    params.effectOnPerson ??
    "This decision may affect your service experience or access.";

  return {
    plainLanguage: `${params.title}\n\n${params.summary}\n\nWhat this means: ${effect}\n\nHow to challenge this: ${params.appealHowTo}`,
    easyRead: `${params.title}\n\nDecision: ${params.summary}\n\nWhat changes: ${effect}\n\nYou can ask us to review this decision. ${params.appealHowTo}`,
    detailedNotice: [
      params.summary,
      "Reasons based on recorded evidence:",
      ...reasonLines,
      `Effect: ${effect}`,
      `Appeal path: ${params.appealHowTo}`,
    ].join("\n"),
    machineReadable: {
      title: params.title,
      summary: params.summary,
      effectOnPerson: effect,
      appealHowTo: params.appealHowTo,
      appealDeadlineAt: params.appealDeadlineAt?.toISOString(),
      reasons: params.evidenceBackedReasons,
      excludesChainOfThought: true,
    },
  };
}

export async function createDecisionNotice(params: {
  decisionId: string;
  printableRef?: string;
  appealDeadlineAt?: Date;
  fields: NoticeFields;
}) {
  if (!noticeIsComplete(params.fields))
    throw new Error("DECISION_NOTICE_INCOMPLETE");

  return prisma.decisionNotice.create({
    data: {
      decisionId: params.decisionId,
      printableRef: params.printableRef,
      appealDeadlineAt: params.appealDeadlineAt,
      ...params.fields,
    },
  });
}

export async function attachEvidenceReference(params: {
  decisionId: string;
  label: string;
  evidenceRef: string;
  sensitivity: string;
}) {
  return prisma.decisionEvidenceReference.create({
    data: params,
  });
}
