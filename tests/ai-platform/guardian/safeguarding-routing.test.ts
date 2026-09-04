import { afterEach, describe, expect, it } from "vitest";

import { evaluateGuardianPolicy } from "@/lib/ai/platform/guardian/guardian-policy";
import {
  evaluateSafeguardingGate,
  safeguardingGateMayDecideReportability,
} from "@/lib/ai/platform/policies/safeguarding-gate";

describe("Guardian safeguarding routing", () => {
  afterEach(() => {
    delete process.env.MAPABLE_GUARDIAN_ENABLED;
  });

  it("preserves safeguarding gate human-only invariants", () => {
    const gate = evaluateSafeguardingGate({
      objective: "mandatory report about elder abuse",
      evidenceRefs: ["e1"],
      traceId: "t1",
    });
    expect(gate.halted).toBe(true);
    if (!gate.halted) return;
    expect(gate.aiMayDecideReportability).toBe(false);
    expect(safeguardingGateMayDecideReportability()).toBe(false);
  });

  it("Guardian does not create reportability findings from safeguarding signals", () => {
    process.env.MAPABLE_GUARDIAN_ENABLED = "true";
    const d = evaluateGuardianPolicy(
      {
        purpose: "safeguarding_classification",
        actorId: "u1",
        dataClasses: ["safeguarding"],
        authorityGranted: true,
        consentScopesPresent: ["care.share", "safeguarding.disclose"],
        objectiveText: "possible neglect allegation needs review",
      },
      [
        {
          signalId: "sig-1",
          signalType: "possible_neglect",
          capabilityKey: "guardian.safeguarding_signal_detection",
          provenance: "model_inference",
          generatedAt: new Date().toISOString(),
        },
      ]
    );

    expect(d.decision).toBe("ROUTE_TO_HUMAN_REVIEW");
    expect(d.requiresHumanReportabilityAssessment).toBe(true);
    expect(d.aiMayDecideReportability).toBe(false);
    expect(d.incidentId).toBeUndefined();
    expect(d.modelSignals.every((s) => s.provenance === "model_inference")).toBe(
      true
    );
  });
});
