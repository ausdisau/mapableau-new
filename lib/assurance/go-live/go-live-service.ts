import { evaluateGoLiveDecision } from "@/lib/assurance/go-live/decision-policy";
import {
  assertPilotNotAutoActivated,
  nextPilotStatusAfterApproval,
} from "@/lib/assurance/go-live/pilot-policy";
import {
  buildDefaultRollbackPlan,
  rollbackPlanIsAdequate,
} from "@/lib/assurance/go-live/rollback-policy";
import { partnershipIsApproved } from "@/lib/assurance/ndia-application/digital-partnership-service";
import { evaluateAssuranceReadiness } from "@/lib/assurance/readiness/evaluate-assurance-readiness";
import { prisma } from "@/lib/prisma";

export async function assessProductionGoLive(params: {
  organisationId?: string | null;
  assessedById?: string | null;
  featureFlagsSatisfied?: boolean;
  workerTrustSatisfied?: boolean;
  rollbackPlanDocumented?: boolean;
}) {
  const organisationId = params.organisationId ?? null;

  const [assurance, registration, partnership] = await Promise.all([
    evaluateAssuranceReadiness({ organisationId }),
    organisationId
      ? prisma.ndisRegistrationApplication.findFirst({
          where: { organisationId },
          orderBy: { updatedAt: "desc" },
        })
      : Promise.resolve(null),
    organisationId
      ? prisma.ndiaDigitalPartnershipApplication.findFirst({
          where: { organisationId },
          orderBy: { updatedAt: "desc" },
        })
      : Promise.resolve(null),
  ]);

  const rollbackDocumented =
    params.rollbackPlanDocumented ??
    rollbackPlanIsAdequate(buildDefaultRollbackPlan());

  const policy = evaluateGoLiveDecision({
    featureFlagsSatisfied: params.featureFlagsSatisfied ?? false,
    assuranceDecision: assurance.decision,
    registrationSatisfied: registration?.status === "approved_externally",
    ndiaPartnershipSatisfied: partnership
      ? partnershipIsApproved(partnership.status)
      : false,
    workerTrustSatisfied: params.workerTrustSatisfied ?? false,
    rollbackPlanDocumented: rollbackDocumented,
  });

  return prisma.productionGoLiveAssessment.create({
    data: {
      organisationId,
      decision: policy.decision,
      readinessDecision: assurance.decision,
      featureFlagsSatisfied: params.featureFlagsSatisfied ?? false,
      assuranceSatisfied:
        assurance.decision === "ready_for_controlled_pilot" ||
        assurance.decision === "ready_for_external_assurance",
      registrationSatisfied: registration?.status === "approved_externally",
      ndiaPartnershipSatisfied: partnership
        ? partnershipIsApproved(partnership.status)
        : false,
      workerTrustSatisfied: params.workerTrustSatisfied ?? false,
      rollbackPlanDocumented: rollbackDocumented,
      decisionNotes: policy.blockingReasons.join("; ") || null,
      assessedById: params.assessedById ?? null,
      assessedAt: new Date(),
    },
  });
}

function slugCode(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${base || "pilot"}-${Date.now().toString(36)}`;
}

/**
 * Creates a Wave 7 ControlledPilot draft linked to an optional go-live assessment.
 * Empty allowlists deny all. limitedLiveEnabled remains false.
 */
export async function createControlledPilotDraft(params: {
  organisationId: string;
  name: string;
  scopeStatement: string;
  createdById: string;
  maxParticipants?: number;
  goLiveAssessmentId?: string | null;
}) {
  const pilot = await prisma.controlledPilot.create({
    data: {
      organisationId: params.organisationId,
      name: params.name,
      code: slugCode(params.name),
      summary: params.scopeStatement,
      createdById: params.createdById,
      maxActiveParticipants: params.maxParticipants ?? 0,
      goLiveAssessmentId: params.goLiveAssessmentId ?? null,
      status: "draft",
      stage: "design",
      supportItemAllowlist: [],
      fundingRouteAllowlist: [],
      integrationProfileIds: [],
      limitedLiveEnabled: false,
      resumeRequiresDecision: true,
    },
  });

  assertPilotNotAutoActivated(pilot);
  return pilot;
}

export async function approveControlledPilot(params: {
  pilotId: string;
  approvedById: string;
}) {
  const existing = await prisma.controlledPilot.findUnique({
    where: { id: params.pilotId },
  });
  if (!existing) throw new Error("CONTROLLED_PILOT_NOT_FOUND");

  const status = nextPilotStatusAfterApproval(existing.status);
  const pilot = await prisma.controlledPilot.update({
    where: { id: params.pilotId },
    data: {
      status,
      updatedById: params.approvedById,
      limitedLiveEnabled: false,
    },
  });

  assertPilotNotAutoActivated(pilot);
  return pilot;
}

export async function listGoLiveAssessments(organisationId?: string) {
  return prisma.productionGoLiveAssessment.findMany({
    where: organisationId ? { organisationId } : undefined,
    orderBy: { createdAt: "desc" },
    include: { pilots: true },
  });
}
