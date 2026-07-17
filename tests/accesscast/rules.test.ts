import { afterEach, describe, expect, it } from "vitest";

import {
  ACCESSCAST_PERMANENT_DENY_FLAGS,
  assertClientCannotEnableAccessCastDenyFlags,
  assertFailedHardBlocksStable,
  calculateAccessCastState,
  type AccessCastRuleInputs,
} from "@/lib/accesscast";

const base: AccessCastRuleInputs = {
  requirements: [],
  hasActiveVerifiedBlocker: false,
  hasConflicts: false,
  criticalEvidenceStale: false,
  hasSinglePointOfFailure: false,
  fallback: null,
  hasAdditionalBurden: false,
  blockingEvidenceClasses: [],
  offlineBeyondExpiry: false,
  horizon: "day_outlook",
  serviceRequestedButUnconfirmed: false,
  overlappingUncertaintyOnHardRequirement: false,
};

afterEach(() => {
  delete process.env.MAPABLE_ACCESSCAST_ENABLED;
  delete process.env.MAPABLE_ACCESSCAST_MODE;
});

describe("AccessCast rules", () => {
  it("returns cannot_confirm for unknown hard requirements", () => {
    const state = calculateAccessCastState({
      ...base,
      requirements: [
        {
          ontologyConceptId: "physical.lift_operational",
          kind: "require",
          status: "unresolved",
          hard: true,
          detail: "unknown",
        },
      ],
    });
    expect(state).toBe("cannot_confirm");
  });

  it("never returns stable when a hard requirement failed", () => {
    const state = calculateAccessCastState({
      ...base,
      requirements: [
        {
          ontologyConceptId: "physical.step_free",
          kind: "require",
          status: "failed",
          hard: true,
          detail: "blocked",
        },
      ],
      hasActiveVerifiedBlocker: true,
      blockingEvidenceClasses: ["independently_verified_claim"],
    });
    expect(state).toBe("temporarily_unavailable");
    expect(assertFailedHardBlocksStable(state, 1)).toBe(true);
  });

  it("produces fragile for SPOF without verified fallback", () => {
    const state = calculateAccessCastState({
      ...base,
      requirements: [
        {
          ontologyConceptId: "physical.step_free",
          kind: "require",
          status: "matched",
          hard: true,
          detail: "ok",
        },
      ],
      hasSinglePointOfFailure: true,
      fallback: {
        id: "fb",
        label: "none",
        verified: false,
        summary: "No verified fallback",
        limitations: [],
      },
    });
    expect(state).toBe("fragile");
  });

  it("returns stale when critical evidence is stale", () => {
    const state = calculateAccessCastState({
      ...base,
      requirements: [
        {
          ontologyConceptId: "physical.lift_operational",
          kind: "require",
          status: "matched",
          hard: true,
          detail: "was ok",
        },
      ],
      criticalEvidenceStale: true,
    });
    expect(state).toBe("stale");
  });

  it("does not let model_candidate alone create temporarily_unavailable", () => {
    const state = calculateAccessCastState({
      ...base,
      hasActiveVerifiedBlocker: true,
      blockingEvidenceClasses: ["model_candidate"],
      requirements: [
        {
          ontologyConceptId: "physical.step_free",
          kind: "require",
          status: "matched",
          hard: true,
          detail: "ok",
        },
      ],
    });
    expect(state).not.toBe("temporarily_unavailable");
  });

  it("returns conflicting when sources disagree", () => {
    expect(calculateAccessCastState({ ...base, hasConflicts: true })).toBe("conflicting");
  });

  it("returns degraded when additional burden applies without hard failure", () => {
    const state = calculateAccessCastState({
      ...base,
      requirements: [
        {
          ontologyConceptId: "physical.step_free",
          kind: "require",
          status: "matched",
          hard: true,
          detail: "ok",
        },
      ],
      hasAdditionalBurden: true,
    });
    expect(state).toBe("degraded");
  });

  it("keeps permanent deny flags false and blocks client enablement", () => {
    expect(ACCESSCAST_PERMANENT_DENY_FLAGS.safetyGuarantee).toBe(false);
    expect(ACCESSCAST_PERMANENT_DENY_FLAGS.aiStateDecision).toBe(false);
    expect(ACCESSCAST_PERMANENT_DENY_FLAGS.paidConfidence).toBe(false);
    const blocked = assertClientCannotEnableAccessCastDenyFlags({
      MAPABLE_ACCESSCAST_AI_STATE_DECISION_ENABLED: "true",
      MAPABLE_ACCESSCAST_PAID_CONFIDENCE_ENABLED: "1",
    });
    expect(blocked).toContain("MAPABLE_ACCESSCAST_AI_STATE_DECISION_ENABLED");
    expect(blocked).toContain("MAPABLE_ACCESSCAST_PAID_CONFIDENCE_ENABLED");
  });
});
