import { afterEach, describe, expect, it } from "vitest";

import {
  acceptCandidate,
  assertCandidateNotMeasurement,
  createAndPlanMission,
  processMultimodalInput,
  rejectCandidate,
  requireMission,
  resetMissionStore,
  resetMultimodalStore,
  stripExifByDefault,
} from "@/lib/aura";

afterEach(() => {
  resetMissionStore();
  resetMultimodalStore();
});

describe("Wave 6 — multimodal input", () => {
  it("text-only workflow works", () => {
    const res = createAndPlanMission({
      goal: "Interview",
      selectedModules: ["access"],
      placeId: "place-harbour-civic",
      scenarioId: "taylor-harbour-interview",
      userId: "u1",
    });
    const candidates = processMultimodalInput({
      userId: "u1",
      multimodal: {
        missionId: res.missionId,
        text: "Is this Entrance B?",
        requestedPurpose: "identify_place_element",
        processingPreference: "no_ai",
        createdAt: new Date().toISOString(),
      },
    });
    expect(candidates).toHaveLength(0);
  });

  it("entrance photo produces provisional candidates", () => {
    const candidates = processMultimodalInput({
      userId: "u1",
      multimodal: {
        text: "Is this Entrance B?",
        images: [{ localReference: "local://img1", retained: false, locationMetadataIncluded: false }],
        requestedPurpose: "identify_place_element",
        processingPreference: "local_only",
        createdAt: new Date().toISOString(),
      },
    });
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0]?.description).toMatch(/not verified/i);
    assertCandidateNotMeasurement(candidates[0]!);
  });

  it("EXIF stripped by default", () => {
    expect(stripExifByDefault(false)).toBe(true);
  });

  it("rejected candidate is not kept as evidence", () => {
    const candidates = processMultimodalInput({
      userId: "u1",
      multimodal: {
        images: [{ localReference: "local://img2", retained: false, locationMetadataIncluded: false }],
        requestedPurpose: "describe_image",
        processingPreference: "local_only",
        createdAt: new Date().toISOString(),
      },
    });
    const obs = candidates.find((c) => c.candidateType === "obstruction");
    expect(obs).toBeDefined();
    const rejected = rejectCandidate({ candidateId: obs!.id, userId: "u1" });
    expect(rejected.state).toBe("rejected");
    const accepted = acceptCandidate({ candidateId: candidates[0]!.id, userId: "u1" });
    expect(accepted.state).toBe("accepted_as_observation_draft");
    expect(accepted.exactMeasurementAvailable).toBe(false);
  });
});
