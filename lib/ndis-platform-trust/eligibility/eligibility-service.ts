import type {
  WorkerBanningAssessmentStatus,
  WorkerClearanceStatus,
  WorkerPlatformEligibilityStatus,
} from "@prisma/client";

import { banningStatusIsClear } from "@/lib/ndis-platform-trust/banning-orders/banning-policy";
import { clearanceSupportsEligibility } from "@/lib/ndis-platform-trust/worker-clearance/clearance-policy";
import { prisma } from "@/lib/prisma";

export function deriveEligibilityStatus(params: {
  clearanceStatus: WorkerClearanceStatus;
  banningStatus: WorkerBanningAssessmentStatus;
}): {
  status: WorkerPlatformEligibilityStatus;
  blocksPlatformWork: boolean;
  rationale: string;
} {
  if (params.clearanceStatus === "pending" || params.clearanceStatus === "not_started") {
    return {
      status: "pending_clearance",
      blocksPlatformWork: true,
      rationale: "Pending clearance is not eligible for platform work.",
    };
  }

  if (params.clearanceStatus === "self_declared") {
    return {
      status: "ineligible",
      blocksPlatformWork: true,
      rationale: "Self-declared clearance is not verified eligibility.",
    };
  }

  if (params.banningStatus === "source_unavailable") {
    return {
      status: "source_unavailable",
      blocksPlatformWork: true,
      rationale: "Banning-order source unavailable — fail closed, not clear.",
    };
  }

  if (params.banningStatus === "match_found") {
    return {
      status: "ineligible",
      blocksPlatformWork: true,
      rationale: "Banning-order match found.",
    };
  }

  if (
    clearanceSupportsEligibility(params.clearanceStatus) &&
    banningStatusIsClear(params.banningStatus)
  ) {
    return {
      status: "eligible",
      blocksPlatformWork: false,
      rationale: "Clearance verified and banning check clear.",
    };
  }

  return {
    status: "not_assessed",
    blocksPlatformWork: true,
    rationale: "Insufficient trust signals for eligibility.",
  };
}

export async function assessWorkerPlatformEligibility(params: {
  organisationId: string;
  workerUserId: string;
  clearanceStatus: WorkerClearanceStatus;
  banningStatus: WorkerBanningAssessmentStatus;
  assessedById?: string | null;
}) {
  const derived = deriveEligibilityStatus({
    clearanceStatus: params.clearanceStatus,
    banningStatus: params.banningStatus,
  });

  return prisma.workerPlatformEligibilityAssessment.create({
    data: {
      organisationId: params.organisationId,
      workerUserId: params.workerUserId,
      clearanceStatus: params.clearanceStatus,
      banningStatus: params.banningStatus,
      status: derived.status,
      blocksPlatformWork: derived.blocksPlatformWork,
      rationale: derived.rationale,
      assessedById: params.assessedById ?? null,
      assessedAt: new Date(),
    },
  });
}

export async function listWorkerEligibility(organisationId: string) {
  return prisma.workerPlatformEligibilityAssessment.findMany({
    where: { organisationId },
    orderBy: { updatedAt: "desc" },
  });
}
