import { prisma } from "@/lib/prisma";

export interface AssuranceSnapshot {
  organisationId: string;
  totalControls: number;
  passingControls: number;
  failingControls: number;
  overdueTests: number;
  outstandingExceptions: number;
  generatedAt: string;
}

/**
 * Continuous assurance snapshot for a tenant. Reads Wave 6 assurance tables
 * (SecurityControl, AssuranceException). Lightweight snapshot only — not a
 * substitute for a formal assurance report.
 */
export async function evaluateContinuousAssurance(
  organisationId: string
): Promise<AssuranceSnapshot> {
  const controlsAll = await prisma.securityControl
    .findMany({
      select: { id: true, assuranceStatus: true, nextAssessmentAt: true },
    })
    .catch(
      () =>
        [] as {
          id: string;
          assuranceStatus: string;
          nextAssessmentAt: Date | null;
        }[]
    );
  const exceptions = await prisma.assuranceException
    .count({ where: { organisationId } })
    .catch(() => 0);

  const passing = controlsAll.filter(
    (c) =>
      c.assuranceStatus === "operating_effectively" ||
      c.assuranceStatus === "implemented"
  ).length;
  const failing = controlsAll.length - passing;

  const now = new Date();
  const overdue = controlsAll.filter(
    (c) =>
      c.nextAssessmentAt !== null &&
      c.nextAssessmentAt.getTime() <= now.getTime()
  ).length;

  return {
    organisationId,
    totalControls: controlsAll.length,
    passingControls: passing,
    failingControls: Math.max(0, failing),
    overdueTests: overdue,
    outstandingExceptions: exceptions,
    generatedAt: new Date().toISOString(),
  };
}
