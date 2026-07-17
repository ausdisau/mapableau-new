import { prisma } from "@/lib/prisma";

export async function summariseRegistrationEvidence(applicationId: string) {
  const app = await prisma.ndisRegistrationApplication.findUnique({
    where: { id: applicationId },
  });
  if (!app) throw new Error("REGISTRATION_APPLICATION_NOT_FOUND");

  const frameworks = await prisma.securityFramework.count({ where: { active: true } });
  const operatingControls = await prisma.securityControl.count({
    where: { assuranceStatus: "operating" },
  });
  const currentEvidence = await prisma.assuranceEvidence.count({
    where: { isCurrent: true },
  });

  return {
    applicationId,
    organisationId: app.organisationId,
    includes0137: app.includes0137,
    frameworks,
    operatingControls,
    currentEvidence,
    disclaimer:
      "Evidence summary for internal registration prep only — not an NDIA submission.",
  };
}
