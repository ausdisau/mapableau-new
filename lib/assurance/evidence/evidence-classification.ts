import type { AssuranceEvidenceClassification } from "@prisma/client";

const RANK: Record<AssuranceEvidenceClassification, number> = {
  public: 0,
  internal: 1,
  confidential: 2,
  restricted: 3,
};

export function classificationRank(
  classification: AssuranceEvidenceClassification
): number {
  return RANK[classification];
}

export function isClassificationAtLeast(
  actual: AssuranceEvidenceClassification,
  minimum: AssuranceEvidenceClassification
): boolean {
  return classificationRank(actual) >= classificationRank(minimum);
}

export function assertClassificationAllowedForExport(
  classification: AssuranceEvidenceClassification
): { allowed: boolean; reason?: string } {
  if (classification === "restricted") {
    return {
      allowed: false,
      reason: "Restricted evidence cannot be exported via auditor bundle without break-glass.",
    };
  }
  return { allowed: true };
}
