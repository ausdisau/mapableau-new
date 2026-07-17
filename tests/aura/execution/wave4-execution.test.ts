import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  ACTION_APPROVAL_LABELS,
  AURA_FORBIDDEN_EXECUTION_TOOLS,
  applicationRecords,
  cancelExecution,
  createAndPlanMission,
  createAuraActionProposal,
  createAuraTools,
  evaluateWave4ReleaseGate,
  executeApprovedProposal,
  grantExecutionApproval,
  getExecutionApprovalForProposal,
  getExecutionReceipt,
  rejectShadowReviewAsExecution,
  requireMission,
  resetApplicationRecordStore,
  resetCalibrationStore,
  resetChallengeStore,
  resetCounterfactualStore,
  resetExecutionApprovalStore,
  resetExecutionStore,
  resetLeaseStore,
  resetMemoryStore,
  resetMissionStore,
  resetOfflinePackStore,
  resetOutboxStore,
  resetPreflightSideEffectCounter,
  resetProposalStore,
  resetStopRegistry,
  resetWitnessStore,
  reviewAuraProposal,
  runProposalShadowEvaluation,
  setWave4ReleaseGatePassed,
  stopAuraMission,
  verifyAuraActionProposal,
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
  resetExecutionStore();
  resetExecutionApprovalStore();
  resetOutboxStore();
  resetApplicationRecordStore();
  resetMemoryStore();
  resetCalibrationStore();
  resetExecutionFlagsCache();
}

import { resetExecutionFlagsCache } from "@/lib/aura/execution/flags";

beforeEach(() => {
  process.env.MAPABLE_AURA_TEST_EXECUTION = "true";
  process.env.MAPABLE_AURA_EXECUTION_MODE = "demo";
  process.env.MAPABLE_AURA_WAVE4_GATE_PASSED = "true";
  setWave4ReleaseGatePassed(true);
});

afterEach(() => {
  delete process.env.MAPABLE_AURA_TEST_EXECUTION;
  delete process.env.MAPABLE_AURA_EXECUTION_MODE;
  delete process.env.MAPABLE_AURA_WAVE4_GATE_PASSED;
  resetAll();
});

function taylorMission() {
  const res = createAndPlanMission({
    goal: "Attend interview Room 3.12 at 10:00",
    selectedModules: ["access", "access_passport", "transport"],
    placeId: "place-harbour-civic",
    userId: "demo-participant-taylor",
  });
  return requireMission(res.missionId);
}

function shadowReadyProposal(actionType: Parameters<typeof createAuraActionProposal>[0]["actionType"]) {
  const mission = taylorMission();
  const proposal = createAuraActionProposal({
    missionId: mission.id,
    userId: mission.participantId,
    actionType,
  });
  verifyAuraActionProposal(proposal.id);
  const review = reviewAuraProposal({
    proposalId: proposal.id,
    userId: mission.participantId,
    decision: "accepted_for_shadow",
  });
  runProposalShadowEvaluation({
    proposalId: proposal.id,
    userId: mission.participantId,
    reviewId: review.id,
  });
  return { mission, proposal };
}

describe("AURA Wave 4 — execution approval", () => {
  it("rejects shadow review as execution approval", () => {
    expect(() => rejectShadowReviewAsExecution()).toThrow(
      "AURA_SHADOW_REVIEW_NOT_EXECUTION_APPROVAL",
    );
  });

  it("requires fresh execution approval with action-specific label", () => {
    const { mission, proposal } = shadowReadyProposal("venue_verification_request");
    expect(ACTION_APPROVAL_LABELS.venue_verification_request).toBe(
      "Confirm and send these access questions",
    );
    const approval = grantExecutionApproval({
      proposalId: proposal.id,
      participantId: mission.participantId,
      decision: "approved_for_execution",
      stepUpVerified: true,
    });
    expect(approval.futureReuseAllowed).toBe(false);
    expect(approval.proposalHash).toBe(proposal.proposalHash);
  });

  it("idempotent execute returns same execution", async () => {
    const { mission, proposal } = shadowReadyProposal("transport_request");
    const approval = grantExecutionApproval({
      proposalId: proposal.id,
      participantId: mission.participantId,
      decision: "approved_for_execution",
      stepUpVerified: true,
    });
    const first = await executeApprovedProposal({
      proposalId: proposal.id,
      participantId: mission.participantId,
      approvalId: approval.id,
      stepUpVerified: true,
    });
    const second = await executeApprovedProposal({
      proposalId: proposal.id,
      participantId: mission.participantId,
      approvalId: approval.id,
      stepUpVerified: true,
    });
    expect(second.execution.id).toBe(first.execution.id);
  });
});

describe("AURA Wave 4 — idempotency and receipts", () => {
  it("double execute returns one execution", async () => {
    const { mission, proposal } = shadowReadyProposal("transport_request");
    const approval = grantExecutionApproval({
      proposalId: proposal.id,
      participantId: mission.participantId,
      decision: "approved_for_execution",
      stepUpVerified: true,
    });
    const first = await executeApprovedProposal({
      proposalId: proposal.id,
      participantId: mission.participantId,
      approvalId: approval.id,
      stepUpVerified: true,
    });
    const second = await executeApprovedProposal({
      proposalId: proposal.id,
      participantId: mission.participantId,
      approvalId: approval.id,
      stepUpVerified: true,
    });
    expect(first.execution.id).toBe(second.execution.id);
    expect(applicationRecords.transportRequests.size).toBe(1);
  });

  it("receipt distinguishes request created from ride booked", async () => {
    const { mission, proposal } = shadowReadyProposal("transport_request");
    const approval = grantExecutionApproval({
      proposalId: proposal.id,
      participantId: mission.participantId,
      decision: "approved_for_execution",
      stepUpVerified: true,
    });
    const { execution, receipt } = await executeApprovedProposal({
      proposalId: proposal.id,
      participantId: mission.participantId,
      approvalId: approval.id,
      stepUpVerified: true,
    });
    expect(receipt.participantFacingSummary).toContain("not yet been confirmed");
    expect(receipt.realWorldOutcomeConfirmed).toBe(false);
    const stored = getExecutionReceipt(execution.id);
    expect(stored?.finalState).toBe("succeeded");
  });
});

describe("AURA Wave 4 — flagship Taylor harbour walkthrough", () => {
  it("Part A venue verification execution", async () => {
    const { mission, proposal } = shadowReadyProposal("venue_verification_request");
    const approval = grantExecutionApproval({
      proposalId: proposal.id,
      participantId: mission.participantId,
      decision: "approved_for_execution",
      stepUpVerified: true,
    });
    const { receipt } = await executeApprovedProposal({
      proposalId: proposal.id,
      participantId: mission.participantId,
      approvalId: approval.id,
      stepUpVerified: true,
    });
    expect(applicationRecords.venueVerificationRequests.size).toBe(1);
    expect(receipt.participantFacingSummary).toContain("not yet been received");
  });

  it("Part D Stop AURA preserves transport receipt and blocks new execution", async () => {
    const { mission, proposal: transportProposal } = shadowReadyProposal(
      "transport_request",
    );
    const transportApproval = grantExecutionApproval({
      proposalId: transportProposal.id,
      participantId: mission.participantId,
      decision: "approved_for_execution",
      stepUpVerified: true,
    });
    const transportResult = await executeApprovedProposal({
      proposalId: transportProposal.id,
      participantId: mission.participantId,
      approvalId: transportApproval.id,
      stepUpVerified: true,
    });

    const venueProposal = createAuraActionProposal({
      missionId: mission.id,
      userId: mission.participantId,
      actionType: "venue_verification_request",
    });
    verifyAuraActionProposal(venueProposal.id);
    const venueReview = reviewAuraProposal({
      proposalId: venueProposal.id,
      userId: mission.participantId,
      decision: "accepted_for_shadow",
    });
    runProposalShadowEvaluation({
      proposalId: venueProposal.id,
      userId: mission.participantId,
      reviewId: venueReview.id,
    });
    grantExecutionApproval({
      proposalId: venueProposal.id,
      participantId: mission.participantId,
      decision: "approved_for_execution",
      stepUpVerified: true,
    });

    stopAuraMission(mission.id, mission.participantId);
    expect(applicationRecords.transportRequests.size).toBe(1);
    expect(getExecutionReceipt(transportResult.execution.id)).toBeTruthy();
    await expect(
      executeApprovedProposal({
        proposalId: venueProposal.id,
        participantId: mission.participantId,
        approvalId: getExecutionApprovalForProposal(venueProposal.id)!.id,
        stepUpVerified: true,
      }),
    ).rejects.toThrow(/STOPPED|FORBIDDEN|APPROVAL/);
  });
});

describe("AURA Wave 4 — agent boundary", () => {
  it("tool registry has no execution tools", () => {
    const tools = createAuraTools({
      missionId: "m1",
      userId: "u1",
    });
    const names = Object.keys(tools);
    for (const forbidden of AURA_FORBIDDEN_EXECUTION_TOOLS) {
      expect(names).not.toContain(forbidden);
    }
    expect(names.some((n) => /executeApproved|sendVenue|createTransport/i.test(n))).toBe(
      false,
    );
  });
});

describe("AURA Wave 4 — release gate", () => {
  it("passes release gate checks", () => {
    const gate = evaluateWave4ReleaseGate();
    expect(gate.passed).toBe(true);
    expect(gate.checks.length).toBeGreaterThanOrEqual(20);
  });
});
