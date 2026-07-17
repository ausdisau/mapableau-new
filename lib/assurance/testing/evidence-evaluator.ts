import type {
  AssuranceEvidenceClassification,
  AssuranceTestResult,
} from "@prisma/client";

import { isClassificationAtLeast } from "@/lib/assurance/evidence/evidence-classification";
import { evaluateEvidenceFreshness } from "@/lib/assurance/testing/evidence-freshness";

export type EvidenceCandidate = {
  id: string;
  isCurrent: boolean;
  collectedAt: Date;
  expiresAt?: Date | null;
  classification: AssuranceEvidenceClassification;
  checksumSha256?: string | null;
};

export type EvidenceEvaluation = {
  acceptable: boolean;
  result: AssuranceTestResult;
  reasons: string[];
};

export function evaluateControlEvidence(params: {
  evidence: EvidenceCandidate[];
  freshnessDays: number;
  minimumClassification?: AssuranceEvidenceClassification;
  requireChecksum?: boolean;
  now?: Date;
}): EvidenceEvaluation {
  const reasons: string[] = [];
  const current = params.evidence.filter((e) => e.isCurrent);

  if (current.length === 0) {
    return {
      acceptable: false,
      result: "fail",
      reasons: ["no_current_evidence"],
    };
  }

  const minimum = params.minimumClassification ?? "internal";
  let anyFresh = false;

  for (const item of current) {
    if (!isClassificationAtLeast(item.classification, minimum)) {
      reasons.push(`classification_below_minimum:${item.id}`);
      continue;
    }
    if (params.requireChecksum && !item.checksumSha256) {
      reasons.push(`missing_checksum:${item.id}`);
      continue;
    }
    const freshness = evaluateEvidenceFreshness({
      collectedAt: item.collectedAt,
      expiresAt: item.expiresAt,
      freshnessDays: params.freshnessDays,
      now: params.now,
    });
    if (!freshness.fresh) {
      reasons.push(`${freshness.reason}:${item.id}`);
      continue;
    }
    anyFresh = true;
  }

  if (!anyFresh) {
    return { acceptable: false, result: "fail", reasons };
  }

  return {
    acceptable: true,
    result: reasons.length ? "partial" : "pass",
    reasons,
  };
}
