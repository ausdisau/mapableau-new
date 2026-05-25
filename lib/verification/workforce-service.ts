import type { PanelActor } from "@/lib/access-control/panel-access";
import { assertOrganisationAccess } from "@/lib/access-control/panel-access";
import { assertWorkerMatchEligible } from "@/lib/access-control/safety-gates";
import { prisma } from "@/lib/prisma";

export async function getWorkforceVerificationMatrix(
  actor: PanelActor,
  organisationId: string
) {
  await assertOrganisationAccess(actor, organisationId, "WorkerProfile");

  const workers = await prisma.workerProfile.findMany({
    where: { organisationId },
    include: {
      screeningChecks: true,
      credentialDocuments: true,
    },
    orderBy: { displayName: "asc" },
  });

  return workers.map((w) => ({
    id: w.id,
    displayName: w.displayName,
    active: w.active,
    workerScreeningStatus: w.workerScreeningStatus,
    wwccStatus: w.wwccStatus,
    firstAidStatus: w.firstAidStatus,
    verificationStatus: w.verificationStatus,
    screeningChecks: w.screeningChecks,
    credentials: w.credentialDocuments,
    matchEligible:
      w.workerScreeningStatus === "verified" ||
      w.verificationStatus === "verified",
  }));
}

export async function validateWorkerForMatch(
  workerProfileId: string
): Promise<{ eligible: boolean; reason?: string }> {
  try {
    await assertWorkerMatchEligible(workerProfileId);
    return { eligible: true };
  } catch (e) {
    const err = e as { message?: string };
    return { eligible: false, reason: err.message ?? "Not eligible" };
  }
}
