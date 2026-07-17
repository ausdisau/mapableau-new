/**
 * Wave 11 — Continuity reliability.
 *
 * Basic operational reliability metrics for the continuity system. Read-only.
 */

import { prisma } from "@/lib/prisma";

export async function computeContinuityReliabilitySummary(organisationId: string, sinceHours = 24 * 7) {
  const since = new Date(Date.now() - sinceHours * 60 * 60 * 1000);

  const [openCases, staleSignals, executionUnknown] = await Promise.all([
    prisma.continuityCase.count({
      where: { organisationId, status: { notIn: ["closed", "abandoned", "resolved"] } },
    }),
    prisma.continuitySignal.count({
      where: { organisationId, status: "stale", observedAt: { gte: since } },
    }),
    prisma.continuityRecoveryExecution.count({
      where: {
        status: "execution_unknown",
        finishedAt: { gte: since },
      },
    }),
  ]);

  return {
    organisationId,
    since,
    openCases,
    staleSignals,
    executionUnknown,
  };
}
