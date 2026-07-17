import type { NdisRegistrationPathway } from "@prisma/client";

import { evaluateAssuranceReadiness } from "@/lib/assurance/readiness/evaluate-assurance-readiness";
import { deriveRegistrationReadinessDecision } from "@/lib/assurance/registration/registration-decision-service";
import { prisma } from "@/lib/prisma";

export async function createRegistrationApplication(params: {
  organisationId: string;
  pathway: NdisRegistrationPathway;
  registrationGroups?: string[];
  ownerUserId?: string | null;
}) {
  const groups = params.registrationGroups ?? [];
  const includes0137 = groups.includes("0137");

  return prisma.ndisRegistrationApplication.create({
    data: {
      organisationId: params.organisationId,
      pathway: params.pathway,
      registrationGroups: groups,
      includes0137,
      ownerUserId: params.ownerUserId ?? null,
      status: "draft",
      readinessDecision: "not_ready",
    },
  });
}

export async function listRegistrationApplications(organisationId?: string) {
  return prisma.ndisRegistrationApplication.findMany({
    where: organisationId ? { organisationId } : undefined,
    orderBy: { updatedAt: "desc" },
  });
}

export async function refreshRegistrationReadiness(applicationId: string) {
  const app = await prisma.ndisRegistrationApplication.findUnique({
    where: { id: applicationId },
  });
  if (!app) throw new Error("REGISTRATION_APPLICATION_NOT_FOUND");

  const assurance = await evaluateAssuranceReadiness({
    organisationId: app.organisationId,
    registrationApprovedExternally: app.status === "approved_externally",
  });

  const derived = deriveRegistrationReadinessDecision({
    status: app.status,
    includes0137: app.includes0137,
    evidenceComplete: app.status !== "draft" && app.status !== "evidence_incomplete",
    assuranceDecision: assurance.decision,
  });

  return prisma.ndisRegistrationApplication.update({
    where: { id: applicationId },
    data: {
      readinessDecision: derived.readinessDecision,
      decisionNotes: derived.notes.join(" "),
      status: derived.canMarkReadyToSubmit ? "ready_to_submit" : app.status,
    },
  });
}
