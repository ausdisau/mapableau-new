import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  HARBOUR_WORLD_REF,
  TAYLOR_PERSONA,
  assertClientCannotEnableDenyFlags,
  loadHarbourStartingWorkScenario,
  REPLAY_PERMANENT_DENY_FLAGS,
  safeValidateScenarioDocument,
  validateScenarioYaml,
} from "@/lib/replay-lab";

describe("Replay Lab scenario schema", () => {
  it("validates harbour-starting-work.v1.yaml", () => {
    const doc = loadHarbourStartingWorkScenario();
    expect(doc.scenario.id).toBe("starting-work-storm");
    expect(doc.participant.fixture).toBe(TAYLOR_PERSONA.id);
    expect(doc.world?.harbourSnapshotId).toBe(HARBOUR_WORLD_REF.snapshotId);
    expect(doc.expected).toContain("unknown_hoist_not_confirmed");
  });

  it("rejects production event namespaces", () => {
    const source = readFileSync(
      join(process.cwd(), "data/replay-lab/harbour-starting-work.v1.yaml"),
      "utf8",
    );
    const poisoned = source.replace(
      "mapable.replay.worker.cancelled",
      "mapable.care.worker.cancelled",
    );
    expect(() => validateScenarioYaml(poisoned)).toThrow(/namespace|Production|Unknown/i);
  });

  it("rejects unknown event types", () => {
    const result = safeValidateScenarioDocument({
      scenario: {
        id: "x",
        version: 1,
        title: "t",
        purpose: "p",
        mode: "engineering_regression",
        author: "a",
        reviewers: [],
        lastReview: null,
        deprecation: "active",
        ontologyVersion: "1",
        canonicalDomainVersions: {},
        policyVersions: {},
      },
      participant: { fixture: "fixture:taylor" },
      goal: { type: "g", outcome: "o" },
      requirements: {},
      timeline: [{ at: "06:00", event: "mapable.replay.not_a_real_event" }],
      expected: ["participant_authority_preserved"],
    });
    expect(result.success).toBe(false);
  });

  it("keeps permanent deny flags false and blocks client overrides", () => {
    expect(REPLAY_PERMANENT_DENY_FLAGS.productionData).toBe(false);
    expect(REPLAY_PERMANENT_DENY_FLAGS.universalScore).toBe(false);
    const blocked = assertClientCannotEnableDenyFlags({
      MAPABLE_REPLAY_PRODUCTION_WRITES_ENABLED: "true",
      MAPABLE_REPLAY_AI_RELEASE_APPROVAL_ENABLED: "1",
    });
    expect(blocked).toEqual(
      expect.arrayContaining([
        "MAPABLE_REPLAY_PRODUCTION_WRITES_ENABLED",
        "MAPABLE_REPLAY_AI_RELEASE_APPROVAL_ENABLED",
      ]),
    );
  });
});
