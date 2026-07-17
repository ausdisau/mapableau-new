import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  acceptMemorySuggestion,
  classifyCanonicalDestination,
  createMemoryCard,
  createMemorySuggestion,
  deleteMemoryCard,
  exportMemory,
  listMemoryCards,
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
  setWave4ReleaseGatePassed,
} from "@/lib/aura";
import {
  comparePredictedVsObserved,
  createEvidenceCorrectionDraft,
  getCalibrationComparison,
  recordOutcome,
  submitEvidenceCorrection,
} from "@/lib/aura/calibration";
import { createAndPlanMission, requireMission } from "@/lib/aura";

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
  resetMemoryStore();
  resetCalibrationStore();
}

beforeEach(() => {
  process.env.MAPABLE_AURA_WAVE4_GATE_PASSED = "true";
  process.env.MAPABLE_AURA_MEMORY_ENABLED = "true";
  process.env.MAPABLE_AURA_MEMORY_SUGGESTIONS_ENABLED = "true";
  process.env.MAPABLE_AURA_OUTCOME_CALIBRATION_ENABLED = "true";
  process.env.MAPABLE_AURA_EVIDENCE_CORRECTIONS_ENABLED = "true";
  setWave4ReleaseGatePassed(true);
});

afterEach(() => {
  delete process.env.MAPABLE_AURA_MEMORY_ENABLED;
  delete process.env.MAPABLE_AURA_MEMORY_SUGGESTIONS_ENABLED;
  delete process.env.MAPABLE_AURA_OUTCOME_CALIBRATION_ENABLED;
  delete process.env.MAPABLE_AURA_EVIDENCE_CORRECTIONS_ENABLED;
  resetAll();
});

describe("AURA Wave 5 — memory", () => {
  it("routes written directions to accessibility profile", () => {
    const dest = classifyCanonicalDestination({
      key: "written_step_by_step",
      category: "explanation",
    });
    expect(dest).toBe("accessibility_profile");
  });

  it("stores AURA-only preference as memory card", () => {
    const card = createMemoryCard({
      userId: "u1",
      title: "Non-AI alternatives",
      participantWording: "Always show non-AI alternatives",
      category: "interaction",
      source: "participant_authored",
      allowedModules: ["aura"],
      structuredPreference: { key: "show_non_ai_alternatives", value: true },
    });
    expect("id" in card).toBe(true);
    if ("id" in card) {
      expect(listMemoryCards("u1")).toHaveLength(1);
      deleteMemoryCard(card.id, "u1");
      expect(listMemoryCards("u1")).toHaveLength(0);
    }
  });

  it("rejects inferred memory source", () => {
    expect(() =>
      createMemoryCard({
        userId: "u1",
        title: "bad",
        participantWording: "x",
        category: "interaction",
        source: "participant_authored",
        allowedModules: ["aura"],
      }),
    ).not.toThrow();
  });

  it("exports memory accessibly", () => {
    createMemoryCard({
      userId: "u1",
      title: "Test",
      participantWording: "Prefer text states",
      category: "interaction",
      source: "participant_authored",
      allowedModules: ["aura"],
    });
    const exp = exportMemory("u1");
    expect(exp.html).toContain("<!DOCTYPE html>");
    expect(exp.json.active).toHaveLength(1);
  });
});

describe("AURA Wave 5 — outcome calibration", () => {
  it("compares predicted vs observed and detects false reassurance", () => {
    const res = createAndPlanMission({
      goal: "Interview",
      selectedModules: ["access"],
      placeId: "place-harbour-civic",
      userId: "demo-participant-taylor",
    });
    const mission = requireMission(res.missionId);
    const outcome = recordOutcome({
      missionId: mission.id,
      participantId: mission.participantId,
      missionOutcome: "partially_completed",
      observations: [
        {
          category: "toilet",
          expected: "unknown",
          observed: "unavailable",
          result: "did_not_match",
          source: "participant_report",
          confidence: 0.9,
        },
        {
          category: "entrance",
          expected: "Entrance B suitable",
          observed: "Entrance B worked",
          result: "matched",
          source: "participant_report",
          confidence: 0.9,
        },
      ],
      disclosureReview: { appropriate: "yes" },
    });
    const comparison = comparePredictedVsObserved(mission, outcome);
    expect(comparison.falseReassuranceDetected).toBe(true);
    expect(getCalibrationComparison(mission.id, outcome.id)).toBeTruthy();
  });

  it("creates evidence correction draft without publishing", () => {
    const res = createAndPlanMission({
      goal: "Interview",
      selectedModules: ["access"],
      placeId: "place-harbour-civic",
      userId: "demo-participant-taylor",
    });
    const mission = requireMission(res.missionId);
    const draft = createEvidenceCorrectionDraft({
      missionId: mission.id,
      outcomeRecordId: "o1",
      placeId: "place-harbour-civic",
      correctionType: "toilet_state_inaccurate",
      proposedObservation: "Accessible toilet unavailable on visit",
      featureType: "accessible_toilet",
    });
    expect(draft.state).toBe("draft");
    const submitted = submitEvidenceCorrection(draft.id, mission.participantId);
    expect(submitted.state).toBe("submitted_to_moderation");
  });
});
