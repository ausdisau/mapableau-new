import { afterEach, describe, expect, it } from "vitest";

import {
  assertSupporterCannotDecideAlone,
  buildWorkerReplacementPilot,
  canTransitionDecisionState,
  createSupportSession,
  decisionStudioConfig,
  draftDecisionExplanation,
  recordParticipantSelection,
  reverseDecision,
  sortOptionsNeutrally,
} from "@/lib/decision-studio";

describe("Supported Decision Studio", () => {
  afterEach(() => {
    delete process.env.MAPABLE_DECISION_STUDIO_ENABLED;
    delete process.env.MAPABLE_DECISION_AI_EXPLANATIONS_ENABLED;
    delete process.env.MAPABLE_REVERSIBLE_DECISIONS_ENABLED;
  });

  it("defaults fail-closed", () => {
    expect(decisionStudioConfig.enabled).toBe(false);
    expect(decisionStudioConfig.authorityCeiling).toBe(
      "PARTICIPANT_SELECTS_ONLY"
    );
    expect(decisionStudioConfig.productionClaimStatus).toBe("not_claimable");
  });

  it("allows valid state transitions", () => {
    expect(canTransitionDecisionState("draft", "information_gathering")).toBe(
      true
    );
    expect(canTransitionDecisionState("confirmed", "draft")).toBe(false);
  });

  it("builds worker-replacement pilot without default selection or execution", () => {
    process.env.MAPABLE_DECISION_STUDIO_ENABLED = "true";
    process.env.MAPABLE_REVERSIBLE_DECISIONS_ENABLED = "true";

    const pilot = buildWorkerReplacementPilot({
      caseId: "dec-1",
      participantId: "p1",
      tenantId: "org1",
      careBookingId: "care-99",
      cancelledWorkerId: "worker-7",
      initiatingActorId: "system",
      nowIso: "2026-07-18T00:00:00.000Z",
    });

    expect(pilot.decisionCase.state).toBe("ready_for_decision");
    expect(pilot.options.every((o) => o.isDefault === false)).toBe(true);
    expect(pilot.options[0]?.commercialInterest).toBeNull();
    expect(
      pilot.options.some((o) => o.commercialInterest === "partner_placement_fee")
    ).toBe(true);
    expect(pilot.comparison.humanReviewRequired).toBe(true);
    expect(pilot.executionNote).toMatch(/Care domain/);

    const sorted = sortOptionsNeutrally(pilot.options);
    expect(sorted[0]?.id).toBe("dec-1-opt-same-org");

    const { decisionCase, receipt } = recordParticipantSelection({
      decisionCase: pilot.decisionCase,
      options: pilot.options,
      selectedOptionId: "dec-1-opt-reschedule",
      requireConfirmation: false,
      nowIso: "2026-07-18T00:05:00.000Z",
      coolingOffHours: 24,
    });
    expect(decisionCase.state).toBe("confirmed");
    expect(receipt.executionDelegated).toBe(true);
    expect(receipt.participantSelectedOptionId).toBe("dec-1-opt-reschedule");

    const reversed = reverseDecision({
      decisionCase,
      receipt,
      nowIso: "2026-07-18T00:10:00.000Z",
    });
    expect(reversed.decisionCase.state).toBe("reversed");
    expect(reversed.receipt.finalAction).toBe("reversed");
  });

  it("blocks supporter decide-without-authority", () => {
    process.env.MAPABLE_DECISION_STUDIO_ENABLED = "true";
    expect(() =>
      assertSupporterCannotDecideAlone({
        session: null,
        actorId: "family-1",
        participantId: "p1",
      })
    ).toThrow(/relationship is not authority/);

    const session = createSupportSession({
      id: "sess-1",
      decisionCaseId: "dec-1",
      participantId: "p1",
      supporterId: "family-1",
      supporterAuthority: "assist_only",
      expiresAtIso: "2026-07-19T00:00:00.000Z",
    });
    expect(() =>
      assertSupporterCannotDecideAlone({
        session,
        actorId: "family-1",
        participantId: "p1",
      })
    ).toThrow(/assist_only/);
  });

  it("returns no AI explanation when explanation flag is off", () => {
    process.env.MAPABLE_DECISION_STUDIO_ENABLED = "true";
    const pilot = buildWorkerReplacementPilot({
      caseId: "dec-2",
      participantId: "p1",
      tenantId: "org1",
      careBookingId: "care-1",
      cancelledWorkerId: "w1",
      initiatingActorId: "system",
      nowIso: "2026-07-18T00:00:00.000Z",
    });
    expect(
      draftDecisionExplanation({
        comparison: pilot.comparison,
        optionLabels: pilot.options.map((o) => o.label),
      })
    ).toBeNull();

    process.env.MAPABLE_DECISION_AI_EXPLANATIONS_ENABLED = "true";
    const text = draftDecisionExplanation({
      comparison: pilot.comparison,
      optionLabels: pilot.options.map((o) => o.label),
    });
    expect(text).toMatch(/No option is selected for you/);
  });

  it("refuses pilot when studio flag is off", () => {
    expect(() =>
      buildWorkerReplacementPilot({
        caseId: "dec-x",
        participantId: "p1",
        tenantId: "org1",
        careBookingId: "c1",
        cancelledWorkerId: "w1",
        initiatingActorId: "system",
        nowIso: "2026-07-18T00:00:00.000Z",
      })
    ).toThrow(/MAPABLE_DECISION_STUDIO_ENABLED/);
  });
});
