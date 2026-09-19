import type { GuardianDecision } from "@/lib/ai/platform/guardian";

import type {
  SentinelPolicyDecision,
  SentinelPolicyDisposition,
} from "./contracts";

function dispositionFor(
  decision: GuardianDecision["decision"],
): SentinelPolicyDisposition {
  switch (decision) {
    case "ALLOW":
      return "ALLOW";
    case "ALLOW_WITH_CONDITIONS":
    case "REDACT_BEFORE_PROCESSING":
      return "ALLOW_WITH_CONDITIONS";
    case "REQUIRE_PARTICIPANT_CONFIRMATION":
      return "PARTICIPANT_CONFIRMATION";
    case "ROUTE_TO_HUMAN_REVIEW":
      return "HUMAN_REVIEW";
    case "ROUTE_TO_COMPLAINTS":
      return "COMPLAINT_HANDOFF";
    case "ROUTE_TO_INCIDENT_TRIAGE":
      return "INCIDENT_TRIAGE_HANDOFF";
    case "DENY_DATA_DISCLOSURE":
    case "DENY_PROHIBITED_ACTION":
      return "DENY";
    case "SECURITY_QUARANTINE":
      return "SECURITY_QUARANTINE";
    default: {
      const exhaustive: never = decision;
      return exhaustive;
    }
  }
}

export function mapGuardianDecisionToSentinel(
  decision: GuardianDecision,
): SentinelPolicyDecision {
  return {
    disposition: dispositionFor(decision.decision),
    reasonCodes: [...decision.reasonCodes],
    policyVersion: decision.policyVersion,
    participantConfirmationRequired:
      decision.participantConfirmationRequired,
    humanReviewRequired: decision.humanReviewRequired,
  };
}
