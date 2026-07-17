import type { AssuranceReadinessDecision } from "@prisma/client";

import type { AssuranceReadinessResult } from "@/lib/assurance/readiness/evaluate-assurance-readiness";

export type ReadinessProjection = {
  decision: AssuranceReadinessDecision;
  plainLanguage: string;
  flagsAreNotReadiness: true;
  canSupportApproval: boolean;
  highlights: string[];
};

export function projectAssuranceReadiness(
  result: AssuranceReadinessResult
): ReadinessProjection {
  const canSupportApproval =
    result.decision === "ready_for_controlled_pilot" ||
    result.decision === "ready_for_external_assurance";

  let plainLanguage: string;
  switch (result.decision) {
    case "blocked":
      plainLanguage =
        "Assurance readiness is blocked. Feature flags alone never mean the platform is ready.";
      break;
    case "not_ready":
      plainLanguage =
        "Assurance work has not reached an operating baseline. Do not treat this as registration approval.";
      break;
    case "conditionally_ready":
      plainLanguage =
        "Some controls are in place, but outstanding conditions still block go-live.";
      break;
    case "ready_for_registration_submission":
      plainLanguage =
        "Internal controls may support preparing a registration submission. This is not external approval.";
      break;
    case "ready_for_external_assurance":
      plainLanguage =
        "Internal readiness may support engaging external assurance. Certification is not claimed.";
      break;
    case "ready_for_controlled_pilot":
      plainLanguage =
        "Internal gates allow considering a controlled pilot. Pilots are never auto-activated.";
      break;
    default: {
      const _exhaustive: never = result.decision;
      plainLanguage = String(_exhaustive);
    }
  }

  return {
    decision: result.decision,
    plainLanguage,
    flagsAreNotReadiness: true,
    canSupportApproval,
    highlights: [
      `${result.controlSummary.operating}/${result.controlSummary.total} controls operating`,
      `${result.controlSummary.failedTests} controls with blocking tests`,
      ...result.blockingReasons.slice(0, 5),
    ],
  };
}
