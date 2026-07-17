import type {
  AccessOpsAssuranceAssessment,
  AccessOpsAssuranceOutcome,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { asJsonArray } from "@/lib/prisma-json";

export async function recordAccessOpsAssuranceAssessment(input: {
  controlArea: string;
  outcome: AccessOpsAssuranceOutcome;
  evidenceRefs: string[];
  expiresAt?: Date | null;
  restrictsPublication?: boolean;
  restrictsRouting?: boolean;
  remediationRef?: string | null;
  assessedById?: string | null;
}): Promise<AccessOpsAssuranceAssessment> {
  const evidenceRefs = asJsonArray(input.evidenceRefs);
  if (!evidenceRefs) throw new Error("EVIDENCE_REFS_REQUIRED");
  return prisma.accessOpsAssuranceAssessment.create({
    data: {
      controlArea: input.controlArea,
      outcome: input.outcome,
      evidenceRefs,
      expiresAt: input.expiresAt ?? null,
      restrictsPublication: input.restrictsPublication ?? false,
      restrictsRouting: input.restrictsRouting ?? false,
      remediationRef: input.remediationRef ?? null,
      assessedById: input.assessedById ?? null,
    },
  });
}
