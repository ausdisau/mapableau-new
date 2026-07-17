import type { AssuranceReadinessDecision } from "@prisma/client";

import { exceptionsSupportApproval } from "@/lib/assurance/exceptions/exception-service";
import { deriveOperatingEffectiveness } from "@/lib/assurance/testing/operating-effectiveness";
import { assuranceConfig } from "@/lib/config/assurance";
import { prisma } from "@/lib/prisma";

export type AssuranceReadinessInput = {
  organisationId?: string | null;
  registrationApprovedExternally?: boolean;
  ndiaPartnershipApproved?: boolean;
  openCriticalFindings?: number;
};

export type AssuranceReadinessResult = {
  decision: AssuranceReadinessDecision;
  featureFlagsDoNotEqualReadiness: true;
  blockingReasons: string[];
  controlSummary: {
    total: number;
    operating: number;
    failedTests: number;
    usableExceptions: number;
  };
};

export async function evaluateAssuranceReadiness(
  input: AssuranceReadinessInput = {}
): Promise<AssuranceReadinessResult> {
  const blockingReasons: string[] = [];

  if (!assuranceConfig.evaluationEnabled) {
    return {
      decision: "blocked",
      featureFlagsDoNotEqualReadiness: true,
      blockingReasons: ["ASSURANCE_EVALUATION_DISABLED"],
      controlSummary: { total: 0, operating: 0, failedTests: 0, usableExceptions: 0 },
    };
  }

  const controls = await prisma.securityControl.findMany({
    include: {
      tests: {
        where: { active: true },
        include: { runs: { orderBy: { executedAt: "desc" }, take: 1 } },
      },
      exceptions: true,
      findings: { where: { status: { in: ["open", "in_remediation"] }, severity: "critical" } },
    },
  });

  let operating = 0;
  let failedTests = 0;
  let usableExceptions = 0;

  for (const control of controls) {
    if (control.assuranceStatus === "operating") operating += 1;

    const latestResults = control.tests.map((t) => t.runs[0]?.result ?? "not_run");
    const effectiveness = deriveOperatingEffectiveness(latestResults);
    if (effectiveness.blocksReadiness) {
      failedTests += 1;
      blockingReasons.push(`control_test_block:${control.controlCode}`);
    }

    if (exceptionsSupportApproval(control.exceptions)) {
      usableExceptions += 1;
    } else if (
      control.assuranceStatus === "exception_granted" &&
      !exceptionsSupportApproval(control.exceptions)
    ) {
      blockingReasons.push(`empty_or_expired_exception:${control.controlCode}`);
    }

    if (control.findings.length > 0) {
      blockingReasons.push(`open_critical_finding:${control.controlCode}`);
    }
  }

  if ((input.openCriticalFindings ?? 0) > 0) {
    blockingReasons.push("open_critical_findings");
  }

  // Registration status is informational here — never auto-approves readiness.
  if (input.registrationApprovedExternally) {
    // still must satisfy controls
  } else {
    blockingReasons.push("registration_not_externally_approved");
  }

  if (!input.ndiaPartnershipApproved) {
    blockingReasons.push("ndia_partnership_not_approved");
  }

  const controlSummary = {
    total: controls.length,
    operating,
    failedTests,
    usableExceptions,
  };

  if (blockingReasons.length > 0) {
    const onlyRegistration =
      blockingReasons.every(
        (r) =>
          r === "registration_not_externally_approved" ||
          r === "ndia_partnership_not_approved"
      ) && failedTests === 0 && operating > 0;

    if (onlyRegistration && operating === controls.length && controls.length > 0) {
      return {
        decision: "ready_for_registration_submission",
        featureFlagsDoNotEqualReadiness: true,
        blockingReasons,
        controlSummary,
      };
    }

    return {
      decision: "blocked",
      featureFlagsDoNotEqualReadiness: true,
      blockingReasons,
      controlSummary,
    };
  }

  if (operating === 0 || controls.length === 0) {
    return {
      decision: "not_ready",
      featureFlagsDoNotEqualReadiness: true,
      blockingReasons: ["no_operating_controls"],
      controlSummary,
    };
  }

  return {
    decision: "ready_for_controlled_pilot",
    featureFlagsDoNotEqualReadiness: true,
    blockingReasons: [],
    controlSummary,
  };
}
