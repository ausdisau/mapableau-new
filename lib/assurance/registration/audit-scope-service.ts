import { prisma } from "@/lib/prisma";

export async function buildRegistrationAuditScope(organisationId: string) {
  const [applications, frameworks, findings] = await Promise.all([
    prisma.ndisRegistrationApplication.findMany({
      where: { organisationId },
      select: {
        id: true,
        pathway: true,
        status: true,
        includes0137: true,
        registrationGroups: true,
        readinessDecision: true,
      },
    }),
    prisma.securityFramework.findMany({
      where: { active: true },
      select: { id: true, kind: true, name: true, version: true },
    }),
    prisma.securityFinding.findMany({
      where: {
        organisationId,
        status: { in: ["open", "in_remediation"] },
      },
      select: { id: true, severity: true, title: true, status: true },
    }),
  ]);

  return {
    organisationId,
    applications,
    frameworks,
    openFindings: findings,
    disclaimer:
      "Audit scope is an internal inventory. It does not assert certification or NDIA approval.",
  };
}
