import type { AssuranceTestResult } from "@prisma/client";

import { evaluateControlEvidence } from "@/lib/assurance/testing/evidence-evaluator";
import { recordTestRun } from "@/lib/assurance/testing/test-result-service";
import { prisma } from "@/lib/prisma";

export async function runAutomatedControlTest(params: {
  testId: string;
  executedById?: string | null;
}): Promise<{ result: AssuranceTestResult; runId: string; blocksReadiness: boolean }> {
  const test = await prisma.assuranceControlTest.findUnique({
    where: { id: params.testId },
    include: {
      control: {
        include: {
          assuranceEvidence: {
            where: { isCurrent: true },
          },
        },
      },
    },
  });

  if (!test || !test.active) {
    throw new Error("CONTROL_TEST_NOT_FOUND");
  }

  const evaluation = evaluateControlEvidence({
    evidence: test.control.assuranceEvidence.map((e) => ({
      id: e.id,
      isCurrent: e.isCurrent,
      collectedAt: e.collectedAt,
      expiresAt: e.expiresAt,
      classification: e.classification,
      checksumSha256: e.checksumSha256,
    })),
    freshnessDays: test.control.evidenceFreshnessDays,
    requireChecksum: true,
  });

  const recorded = await recordTestRun({
    testId: test.id,
    result: evaluation.result,
    executedById: params.executedById,
    findingsSummary: evaluation.reasons.join("; ") || null,
    evidenceIds: test.control.assuranceEvidence.map((e) => e.id),
  });

  return {
    result: evaluation.result,
    runId: recorded.id,
    blocksReadiness: recorded.blocksReadiness,
  };
}
