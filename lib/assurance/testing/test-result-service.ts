import type { AssuranceTestResult } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function recordTestRun(params: {
  testId: string;
  result: AssuranceTestResult;
  executedById?: string | null;
  findingsSummary?: string | null;
  evidenceIds?: string[];
}): Promise<{ id: string; blocksReadiness: boolean }> {
  const blocksReadiness =
    params.result === "fail" ||
    params.result === "blocked" ||
    params.result === "not_run" ||
    params.result === "partial";

  const run = await prisma.assuranceControlTestRun.create({
    data: {
      testId: params.testId,
      result: params.result,
      executedById: params.executedById ?? null,
      findingsSummary: params.findingsSummary ?? null,
      evidenceIds: params.evidenceIds ?? [],
      blocksReadiness,
    },
  });

  return { id: run.id, blocksReadiness };
}

export async function latestResultsForControl(controlId: string) {
  const tests = await prisma.assuranceControlTest.findMany({
    where: { controlId, active: true },
    include: {
      runs: { orderBy: { executedAt: "desc" }, take: 1 },
    },
  });

  return tests.map((t) => ({
    testId: t.id,
    name: t.name,
    latest: t.runs[0] ?? null,
  }));
}
