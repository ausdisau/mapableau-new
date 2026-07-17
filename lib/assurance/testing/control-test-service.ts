import type { AssuranceControlTestKind } from "@prisma/client";

import { runAutomatedControlTest } from "@/lib/assurance/testing/control-test-runner";
import { latestResultsForControl } from "@/lib/assurance/testing/test-result-service";
import { prisma } from "@/lib/prisma";

export async function defineControlTest(params: {
  controlId: string;
  name: string;
  kind?: AssuranceControlTestKind;
  procedureSummary: string;
  expectedOutcome: string;
}) {
  return prisma.assuranceControlTest.create({
    data: {
      controlId: params.controlId,
      name: params.name,
      kind: params.kind ?? "manual",
      procedureSummary: params.procedureSummary,
      expectedOutcome: params.expectedOutcome,
    },
  });
}

export async function listControlTests(controlId: string) {
  return prisma.assuranceControlTest.findMany({
    where: { controlId },
    include: { runs: { orderBy: { executedAt: "desc" }, take: 3 } },
    orderBy: { createdAt: "asc" },
  });
}

export async function executeControlTest(params: {
  testId: string;
  executedById?: string | null;
}) {
  return runAutomatedControlTest(params);
}

export async function controlTestSummary(controlId: string) {
  return latestResultsForControl(controlId);
}
