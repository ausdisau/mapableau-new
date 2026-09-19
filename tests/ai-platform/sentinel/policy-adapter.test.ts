import { describe, expect, it } from "vitest";

import type { GuardianDecision } from "@/lib/ai/platform/guardian";
import { mapGuardianDecisionToSentinel } from "@/lib/ai/platform/sentinel/policy-adapter";

const base = {
  reasonCodes: [],
  policyVersion: "guardian-policy-v0.2.0",
  purpose: "test",
  dataClasses: ["operational"],
  sensitivity: "D1_INTERNAL",
  modelSignals: [],
  participantConfirmationRequired: false,
  humanReviewRequired: false,
  explanation: {
    title: "Why MapAble handled this this way",
    plainLanguage: "Test",
    nextSteps: [],
    humanSupportAvailable: true,
    nonAiPathAvailable: true,
  },
} satisfies Omit<GuardianDecision, "decision">;

describe("Guardian to Sentinel policy adapter", () => {
  it("maps participant confirmation without granting execution", () => {
    const result = mapGuardianDecisionToSentinel({
      ...base,
      decision: "REQUIRE_PARTICIPANT_CONFIRMATION",
      participantConfirmationRequired: true,
    });

    expect(result.disposition).toBe("PARTICIPANT_CONFIRMATION");
    expect(result.participantConfirmationRequired).toBe(true);
  });

  it("maps incident routing to a human-owned handoff", () => {
    const result = mapGuardianDecisionToSentinel({
      ...base,
      decision: "ROUTE_TO_INCIDENT_TRIAGE",
      humanReviewRequired: true,
    });

    expect(result.disposition).toBe("INCIDENT_TRIAGE_HANDOFF");
    expect(result.humanReviewRequired).toBe(true);
  });

  it("maps security quarantine without converting it to ordinary denial", () => {
    const result = mapGuardianDecisionToSentinel({
      ...base,
      decision: "SECURITY_QUARANTINE",
    });

    expect(result.disposition).toBe("SECURITY_QUARANTINE");
  });
});
