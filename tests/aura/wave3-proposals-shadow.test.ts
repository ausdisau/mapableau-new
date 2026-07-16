import { afterEach, describe, expect, it } from "vitest";

import {
  AURA_FORBIDDEN_EXECUTION_TOOLS,
  AURA_PROHIBITED_PROPOSAL_TYPES,
  AuraExecutionDisabledError,
  cancelAuraProposal,
  classifyProposalRisk,
  computeProposalHash,
  createAndPlanMission,
  createAuraActionProposal,
  createAuraTools,
  expireDueProposals,
  getPreflightSideEffectCounter,
  getShadowReceipts,
  guardWriteServiceCall,
  isProhibitedAction,
  isProhibitedProposalType,
  requireMission,
  resetChallengeStore,
  resetCounterfactualStore,
  resetLeaseStore,
  resetMissionStore,
  resetOfflinePackStore,
  resetPreflightSideEffectCounter,
  resetProposalStore,
  resetStopRegistry,
  resetWitnessStore,
  reviewAuraProposal,
  reviseAuraProposal,
  runProposalShadowEvaluation,
  stopAuraMission,
  validateTransportRequestDraft,
  validateVenueVerificationDraft,
  verifyAuraActionProposal,
  verifyAuraProposalHash,
  verifyMissionAudit,
} from "@/lib/aura";

function resetAll() {
  resetMissionStore();
  resetLeaseStore();
  resetWitnessStore();
  resetCounterfactualStore();
  resetChallengeStore();
  resetOfflinePackStore();
  resetStopRegistry();
  resetProposalStore();
  resetPreflightSideEffectCounter();
}

afterEach(() => {
  resetAll();
});

function taylor() {
  const res = createAndPlanMission({
    goal: "Attend interview Room 3.12 at 10:00",
    selectedModules: ["access", "access_passport", "transport"],
    placeId: "place-harbour-civic",
    userId: "demo-participant-taylor",
  });
  return requireMission(res.missionId);
}

describe("AURA Wave 3 — proposal creation", () => {
  it("creates five supported proposal types with no external action", () => {
    const mission = taylor();
    const types = [
      "venue_verification_request",
      "visit_plan_share",
      "supporter_notification",
      "transport_request",
      "barrier_report",
    ] as const;
    for (const actionType of types) {
      const p = createAuraActionProposal({
        missionId: mission.id,
        userId: mission.participantId,
        actionType,
      });
      expect(p.actionType).toBe(actionType);
      expect(p.authority.requiredLevel).toBe("L3_PROPOSE");
      expect(p.disclosure.fieldsShared.some((f) => f.key === "diagnosis")).toBe(
        false,
      );
      expect(
        p.disclosure.fieldsOmitted.some((f) => f.key === "diagnosis"),
      ).toBe(true);
      expect(verifyAuraProposalHash(p)).toBe(true);
    }
    expect(getPreflightSideEffectCounter()).toBe(0);
  });

  it("stopped mission cannot create a proposal", () => {
    const mission = taylor();
    stopAuraMission(mission.id, mission.participantId);
    expect(() =>
      createAuraActionProposal({
        missionId: mission.id,
        userId: mission.participantId,
        actionType: "venue_verification_request",
      }),
    ).toThrow(/STOPPED/);
  });

  it("cross-user create is denied", () => {
    const mission = taylor();
    expect(() =>
      createAuraActionProposal({
        missionId: mission.id,
        userId: "intruder",
        actionType: "venue_verification_request",
      }),
    ).toThrow(/FORBIDDEN/);
  });
});

describe("AURA Wave 3 — prohibited and purpose", () => {
  it("rejects prohibited types and keeps registry immutable", () => {
    expect(isProhibitedProposalType("payment_release")).toBe(true);
    expect(isProhibitedProposalType("ndis_claim_submission")).toBe(true);
    expect(isProhibitedProposalType("clinical_diagnosis")).toBe(true);
    expect(AURA_PROHIBITED_PROPOSAL_TYPES).toContain("wheelchair_control");
    expect(isProhibitedAction("approve_or_release_payment")).toBe(true);
  });

  it("assigns deterministic risk", () => {
    expect(classifyProposalRisk("venue_verification_request")).toBe(
      "communication",
    );
    expect(classifyProposalRisk("transport_request")).toBe("service_request");
    expect(classifyProposalRisk("supporter_notification")).toBe(
      "sensitive_disclosure",
    );
  });
});

describe("AURA Wave 3 — hashing and versioning", () => {
  it("hash is stable under key order and changes with payload", () => {
    const mission = taylor();
    const p = createAuraActionProposal({
      missionId: mission.id,
      userId: mission.participantId,
      actionType: "venue_verification_request",
    });
    const h1 = computeProposalHash({
      id: p.id,
      missionId: p.missionId,
      planArtifactId: p.planArtifactId,
      planVersion: p.planVersion,
      version: p.version,
      actionType: p.actionType,
      recipient: p.target.recipientLabel,
      purpose: p.purpose.code,
      payload: { b: 2, a: 1 },
      fieldsShared: p.disclosure.fieldsShared,
      expiresAt: p.expiresAt,
      expectedService: p.target.applicationService,
      risk: p.risk,
    });
    const h2 = computeProposalHash({
      id: p.id,
      missionId: p.missionId,
      planArtifactId: p.planArtifactId,
      planVersion: p.planVersion,
      version: p.version,
      actionType: p.actionType,
      recipient: p.target.recipientLabel,
      purpose: p.purpose.code,
      payload: { a: 1, b: 2 },
      fieldsShared: p.disclosure.fieldsShared,
      expiresAt: p.expiresAt,
      expectedService: p.target.applicationService,
      risk: p.risk,
    });
    expect(h1).toBe(h2);

    const { proposal: v2, diff } = reviseAuraProposal({
      proposalId: p.id,
      userId: mission.participantId,
      changes: { omitArrivalTime: true },
    });
    expect(v2.version).toBe(2);
    expect(v2.previousVersionId).toBe(p.id);
    expect(diff.requiresNewReview).toBe(true);
    expect(verifyAuraProposalHash(v2)).toBe(true);
  });
});

describe("AURA Wave 3 — verifier and shadow", () => {
  it("verifies for shadow with futureExecutionEligible false", () => {
    const mission = taylor();
    const p = createAuraActionProposal({
      missionId: mission.id,
      userId: mission.participantId,
      actionType: "venue_verification_request",
    });
    const v = verifyAuraActionProposal(p.id);
    expect(v.futureExecutionEligible).toBe(false);
    expect(v.status).toMatch(/verified/);
  });

  it("participant shadow acceptance is not execution approval", () => {
    const mission = taylor();
    const p = createAuraActionProposal({
      missionId: mission.id,
      userId: mission.participantId,
      actionType: "venue_verification_request",
    });
    verifyAuraActionProposal(p.id);
    const review = reviewAuraProposal({
      proposalId: p.id,
      userId: mission.participantId,
      decision: "accepted_for_shadow",
    });
    expect(review.futureExecutionApproval).toBe(false);

    const { evaluation, receipt } = runProposalShadowEvaluation({
      proposalId: p.id,
      userId: mission.participantId,
      reviewId: review.id,
    });
    expect(evaluation.executionAttempted).toBe(false);
    expect(evaluation.externalSideEffects).toBe(0);
    expect(receipt.executionAttempted).toBe(false);
    expect(receipt.externalSideEffects).toBe(0);
    expect(receipt.notice).toMatch(/simulation/i);
    expect(evaluation.status).toMatch(/would_allow|indeterminate|would_block/);
  });

  it("preflight validators are side-effect free and detect duplicates", () => {
    resetPreflightSideEffectCounter();
    const ok = validateVenueVerificationDraft({
      questions: ["q1"],
      recipientLabel: "Reception",
    });
    expect(ok.valid).toBe(true);
    const dup = validateTransportRequestDraft({
      pickup: "A",
      destination: "B",
      timeWindow: "09:45",
      existingDuplicate: true,
    });
    expect(dup.duplicateRisk).toBe(true);
    expect(getPreflightSideEffectCounter()).toBe(0);
  });

  it("declined proposal cannot move to shadow", () => {
    const mission = taylor();
    const p = createAuraActionProposal({
      missionId: mission.id,
      userId: mission.participantId,
      actionType: "transport_request",
    });
    verifyAuraActionProposal(p.id);
    reviewAuraProposal({
      proposalId: p.id,
      userId: mission.participantId,
      decision: "declined",
    });
    expect(() =>
      runProposalShadowEvaluation({
        proposalId: p.id,
        userId: mission.participantId,
        reviewId: "nope",
      }),
    ).toThrow(/INVALID_TRANSITION|SHADOW_REVIEW/);
  });
});

describe("AURA Wave 3 — execution guard and tools", () => {
  it("blocks write attempts and records audit", () => {
    const mission = taylor();
    expect(() =>
      guardWriteServiceCall("deliverApprovedVenueVerification", mission.id),
    ).toThrow(AuraExecutionDisabledError);
    const audit = verifyMissionAudit(mission.id);
    expect(audit.valid).toBe(true);
  });

  it("AURA tools include proposal tools and no execution tools", () => {
    const mission = taylor();
    const tools = createAuraTools({
      missionId: mission.id,
      userId: mission.participantId,
    });
    expect(tools.proposeVenueVerification).toBeDefined();
    expect(tools.proposeTransportRequest).toBeDefined();
    expect(tools.runProposalShadowEvaluation).toBeDefined();
    for (const name of AURA_FORBIDDEN_EXECUTION_TOOLS) {
      expect(name in tools).toBe(false);
    }
  });
});

describe("AURA Wave 3 — stop cancels pending proposals", () => {
  it("cancels pending proposal and preserves shadow receipt", () => {
    const mission = taylor();
    const p1 = createAuraActionProposal({
      missionId: mission.id,
      userId: mission.participantId,
      actionType: "venue_verification_request",
    });
    verifyAuraActionProposal(p1.id);
    const review = reviewAuraProposal({
      proposalId: p1.id,
      userId: mission.participantId,
      decision: "accepted_for_shadow",
    });
    const { receipt } = runProposalShadowEvaluation({
      proposalId: p1.id,
      userId: mission.participantId,
      reviewId: review.id,
    });

    const p2 = createAuraActionProposal({
      missionId: mission.id,
      userId: mission.participantId,
      actionType: "supporter_notification",
    });
    verifyAuraActionProposal(p2.id);

    const stop = stopAuraMission(mission.id, mission.participantId);
    expect(stop.receipt.invalidatedProposalIds).toContain(p2.id);
    expect(getShadowReceipts(p1.id).some((r) => r.id === receipt.id)).toBe(
      true,
    );
    expect(() =>
      createAuraActionProposal({
        missionId: mission.id,
        userId: mission.participantId,
        actionType: "barrier_report",
      }),
    ).toThrow(/STOPPED/);
  });
});

describe("AURA Wave 3 — expiry", () => {
  it("expiry worker marks expired without executing", () => {
    const mission = taylor();
    const p = createAuraActionProposal({
      missionId: mission.id,
      userId: mission.participantId,
      actionType: "barrier_report",
    });
    // force expire by cancel path via expireDueProposals with future-past
    const expired = expireDueProposals(Date.parse(p.expiresAt) + 1000);
    expect(expired).toContain(p.id);
  });

  it("cancel proposal works", () => {
    const mission = taylor();
    const p = createAuraActionProposal({
      missionId: mission.id,
      userId: mission.participantId,
      actionType: "visit_plan_share",
    });
    const cancelled = cancelAuraProposal({
      proposalId: p.id,
      userId: mission.participantId,
    });
    expect(cancelled.state).toBe("cancelled");
  });
});
