import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  getOutcomeForMission,
  recordOutcome,
  resetCalibrationStore,
} from "@/lib/aura/calibration";
import {
  createMemoryCard,
  escapeHtml,
  exportMemory,
  listMemoryCards,
  resetMemoryStore,
} from "@/lib/aura/memory";
import {
  registerCalibrationMission,
  resetMissionStore,
} from "@/lib/aura/mission/store";
import { resetWitnessStore } from "@/lib/aura/witness";

describe("Wave 5 memory + calibration", () => {
  beforeEach(() => {
    process.env.MAPABLE_AURA_MEMORY_ENABLED = "true";
    process.env.MAPABLE_AURA_OUTCOME_CALIBRATION_ENABLED = "true";
    resetMemoryStore();
    resetCalibrationStore();
    resetMissionStore();
    resetWitnessStore();
  });

  afterEach(() => {
    delete process.env.MAPABLE_AURA_MEMORY_ENABLED;
    delete process.env.MAPABLE_AURA_OUTCOME_CALIBRATION_ENABLED;
    resetMemoryStore();
    resetCalibrationStore();
    resetMissionStore();
    resetWitnessStore();
  });

  it("creates and lists memory cards for a subject user", () => {
    createMemoryCard({
      userId: "user-a",
      title: "Prefer text",
      participantWording: "Please text me first",
      category: "notification",
      source: "participant_authored",
      allowedModules: ["notifications"],
      canonicalDestination: "aura_memory",
    });
    expect(listMemoryCards("user-a")).toHaveLength(1);
    expect(listMemoryCards("user-b")).toHaveLength(0);
  });

  it("HTML-escapes title and participantWording in memory export", () => {
    createMemoryCard({
      userId: "user-a",
      title: '<script>alert(1)</script>',
      participantWording: 'Hello <img src=x onerror=alert(1)>',
      category: "privacy",
      source: "participant_authored",
      allowedModules: ["memory"],
      canonicalDestination: "aura_memory",
    });
    const { html } = exportMemory("user-a");
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain(escapeHtml('<script>alert(1)</script>'));
    expect(html).toContain(escapeHtml('Hello <img src=x onerror=alert(1)>'));
  });

  it("persists skipped outcomes so getOutcomeForMission can read them", () => {
    const mission = registerCalibrationMission({
      participantId: "participant-1",
    });
    const outcome = recordOutcome({
      missionId: mission.id,
      participantId: "participant-1",
      skipped: true,
      participantComment: "Too tired today",
    });
    expect(outcome.skipped).toBe(true);
    const loaded = getOutcomeForMission(mission.id);
    expect(loaded?.id).toBe(outcome.id);
    expect(loaded?.skipped).toBe(true);
    expect(loaded?.participantComment).toBe("Too tired today");
  });

  it("rejects recordOutcome when participantId does not match mission owner", () => {
    const mission = registerCalibrationMission({
      participantId: "owner",
    });
    expect(() =>
      recordOutcome({
        missionId: mission.id,
        participantId: "attacker",
        skipped: true,
      }),
    ).toThrow(/AURA_MISSION_FORBIDDEN/);
    expect(() =>
      recordOutcome({
        missionId: mission.id,
        participantId: "attacker",
        missionOutcome: "completed",
        observations: [],
      }),
    ).toThrow(/AURA_MISSION_FORBIDDEN/);
  });

  it("records missionOutcome, observations, and participantComment", () => {
    const mission = registerCalibrationMission({
      participantId: "participant-1",
      unknowns: ["toilet availability"],
    });
    const outcome = recordOutcome({
      missionId: mission.id,
      participantId: "participant-1",
      missionOutcome: "partially_completed",
      participantComment: "Lift worked; toilet unclear",
      observations: [
        {
          category: "lift",
          expected: "available",
          observed: "available",
          result: "matched",
          source: "participant_report",
          confidence: 0.9,
        },
      ],
    });
    expect(outcome.missionOutcome).toBe("partially_completed");
    expect(outcome.observations).toHaveLength(1);
    expect(outcome.participantComment).toMatch(/Lift worked/);
  });
});
