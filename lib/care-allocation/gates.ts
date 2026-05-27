import type { CareAllocationAutonomyTier } from "@prisma/client";

import {
  assertWorkerEligibleForBooking,
  loadWorkerForEligibility,
} from "@/lib/care/worker-eligibility";
import { detectCareScheduleConflicts } from "@/lib/care/care-schedule-conflict-service";
import { allocationConfig, resolveAutonomyTier } from "@/lib/config/allocation";
import { runProviderVerificationGate, runSmartContract } from "@/lib/contracts/contract-runner";
import { phase5Config } from "@/lib/config/phase5";
import { prisma } from "@/lib/prisma";

export type GateFinding = {
  code: string;
  message: string;
  severity: "info" | "warning" | "error";
};

export type GateEvaluationResult = {
  gateResult: "passed" | "review_required" | "blocked";
  findings: GateFinding[];
};

const DAY_NAMES = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

function timeInWindow(
  date: Date,
  startTime: string,
  endTime: string,
  dayOfWeek: string
): boolean {
  const dow = DAY_NAMES[date.getUTCDay()];
  if (dow !== dayOfWeek) return false;
  const hhmm = `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
  return hhmm >= startTime && hhmm <= endTime;
}

async function checkAvailability(
  workerProfileId: string,
  organisationId: string,
  startAt: Date,
  endAt: Date
): Promise<GateFinding[]> {
  const windows = await prisma.availabilityWindow.findMany({
    where: {
      active: true,
      organisationId,
      OR: [{ workerProfileId }, { workerProfileId: null }],
    },
  });
  if (windows.length === 0) return [];

  const covered = windows.some((w) =>
    timeInWindow(startAt, w.startTime, w.endTime, w.dayOfWeek)
  );
  if (!covered) {
    return [
      {
        code: "availability_gap",
        message: "No availability window covers the scheduled start time.",
        severity: "warning",
      },
    ];
  }
  return [];
}

export async function evaluateAllocationGates(params: {
  careBookingId: string;
  organisationId: string;
  participantId: string;
  careRequestId: string;
  workerProfileId: string;
  tasks: unknown;
  scheduledStart: Date;
  scheduledEnd: Date;
  actorUserId: string;
  autonomyTier: CareAllocationAutonomyTier;
  combinedScore: number;
  aiMatchRunId?: string | null;
  activeRiskFlags: { flagType: string; severity: string }[];
}): Promise<GateEvaluationResult> {
  const findings: GateFinding[] = [];
  let blocked = false;
  let reviewRequired = false;

  const tier = resolveAutonomyTier(
    params.autonomyTier === "conditional_auto"
      ? "conditional_auto"
      : params.autonomyTier === "recommend_only"
        ? "recommend_only"
        : null
  );

  if (tier === "recommend_only") {
    reviewRequired = true;
    findings.push({
      code: "autonomy_recommend_only",
      message: "Organisation tier is recommend-only; human approval required.",
      severity: "info",
    });
  }

  if (params.combinedScore < allocationConfig.autoMinScore) {
    reviewRequired = true;
    findings.push({
      code: "score_below_threshold",
      message: `Combined score ${params.combinedScore.toFixed(2)} is below auto threshold.`,
      severity: "warning",
    });
  }

  for (const flag of params.activeRiskFlags) {
    if (flag.severity === "high" || flag.severity === "critical") {
      reviewRequired = true;
      findings.push({
        code: "risk_flag",
        message: `Active risk flag: ${flag.flagType} (${flag.severity}).`,
        severity: "warning",
      });
    }
  }

  try {
    const worker = await loadWorkerForEligibility(params.workerProfileId);
    assertWorkerEligibleForBooking(worker, {
      organisationId: params.organisationId,
      tasks: params.tasks,
    });
  } catch (e) {
    blocked = true;
    findings.push({
      code: "worker_eligibility",
      message: e instanceof Error ? e.message : "Worker ineligible",
      severity: "error",
    });
  }

  const providerGate = await runProviderVerificationGate(
    params.organisationId,
    params.actorUserId
  );
  if (
    providerGate.result === "blocked" ||
    providerGate.result === "review_required"
  ) {
    reviewRequired = true;
    findings.push({
      code: "provider_verification",
      message: "Provider verification gate requires review.",
      severity: "warning",
    });
  }

  const conflicts = await detectCareScheduleConflicts({
    workerProfileId: params.workerProfileId,
    careBookingId: params.careBookingId,
    scheduledStart: params.scheduledStart,
    scheduledEnd: params.scheduledEnd,
  });
  if (conflicts.hasConflict) {
    reviewRequired = true;
    for (const c of conflicts.conflicts) {
      findings.push({
        code: c.conflictType,
        message: c.details,
        severity: "warning",
      });
    }
  }

  const availabilityFindings = await checkAvailability(
    params.workerProfileId,
    params.organisationId,
    params.scheduledStart,
    params.scheduledEnd
  );
  findings.push(...availabilityFindings);
  if (availabilityFindings.length) reviewRequired = true;

  if (params.aiMatchRunId && allocationConfig.requireFairnessReview) {
    const fairnessReview = await prisma.fairnessReview.findFirst({
      where: { fairnessCheck: { aiMatchRunId: params.aiMatchRunId } },
    });
    if (!fairnessReview && phase5Config.aiMatchingEnabled) {
      reviewRequired = true;
      findings.push({
        code: "fairness_review_required",
        message: "Fairness review required before auto-assign.",
        severity: "warning",
      });
    }
  }

  const worker = await prisma.workerProfile.findUnique({
    where: { id: params.workerProfileId },
  });
  const org = await prisma.organisation.findUnique({
    where: { id: params.organisationId },
  });

  const careContract = await runSmartContract({
    contractCode: "CARE_ALLOCATION_V1",
    actorUserId: params.actorUserId,
    entityType: "CareBooking",
    entityId: params.careBookingId,
    participantId: params.participantId,
    context: {
      workerVerified: worker?.verificationStatus === "verified",
      providerVerified: org?.verificationStatus === "verified",
      hasScheduleConflict: conflicts.hasConflict,
    },
  });
  if (careContract.result === "blocked") {
    blocked = true;
    findings.push({
      code: "care_allocation_contract",
      message: "Care allocation contract blocked.",
      severity: "error",
    });
  } else if (careContract.result === "review_required") {
    reviewRequired = true;
    findings.push({
      code: "care_allocation_contract",
      message: "Care allocation contract requires review.",
      severity: "warning",
    });
  }

  if (blocked) {
    return { gateResult: "blocked", findings };
  }
  if (reviewRequired || tier === "recommend_only") {
    return { gateResult: "review_required", findings };
  }
  return { gateResult: "passed", findings };
}

export function proposalStatusFromGate(
  gateResult: GateEvaluationResult["gateResult"],
  rank: number
):
  | "auto_eligible"
  | "review_required"
  | "blocked"
  | "recommended"
  | "generated" {
  if (gateResult === "blocked") return "blocked";
  if (gateResult === "passed" && rank === 1) return "auto_eligible";
  if (gateResult === "passed") return "recommended";
  if (gateResult === "review_required" && rank === 1) return "review_required";
  return rank <= 3 ? "recommended" : "generated";
}
