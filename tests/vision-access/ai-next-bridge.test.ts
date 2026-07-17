import { beforeEach, describe, expect, it } from "vitest";

import { clearShadowChangeReviews, listShadowChangeReviews } from "@/lib/access-intelligence-next";
import {
  getDefaultSyntheticScene,
  geometryEstimateToAccessChange,
  perceptionCandidateToAccessChange,
  submitVisionCandidateForShadowReview,
  visionAccessFlags,
} from "@/lib/vision-access";

describe("VisionAccess → AI-Next bridge", () => {
  beforeEach(() => {
    clearShadowChangeReviews();
  });

  it("maps fixture candidates to synthetic_fixture / model_candidate evidence classes", () => {
    const scene = getDefaultSyntheticScene();
    const candidate = scene.candidates[0]!;
    const change = perceptionCandidateToAccessChange({
      candidate,
      subjectNodeId: "harbour_civic.entrance_west",
    });
    expect(change.evidenceClass).toBe("synthetic_fixture");
    expect(change.potentialPublicImpact).toBe("none");
    expect(change.method).toBe("vision_perception_candidate");
  });

  it("maps geometry estimates to device_assisted_estimate never professional", () => {
    const scene = getDefaultSyntheticScene();
    const estimate = scene.geometryEstimates[0];
    if (!estimate) {
      // Fixture may omit geometry — still assert helper invariants with a stub
      const change = geometryEstimateToAccessChange({
        estimate: {
          id: "geom-test",
          target: "clear_width",
          method: "visual_inference",
          valueLow: 840,
          valueHigh: 900,
          unit: "mm",
          displayLabel: "840–900 mm provisional",
          deviceCapabilityTier: 2,
          frameCount: 3,
          confidenceMapCoverage: null,
          calibrationStatus: "not_calibrated",
          conditions: ["synthetic"],
          manualConfirmation: false,
          provisional: true,
          notACertifiedMeasurement: true,
        },
        subjectNodeId: "harbour_civic.entrance_west",
      });
      expect(change.evidenceClass).toBe("device_assisted_estimate");
      expect(change.evidenceClass).not.toBe("professional_measurement");
      return;
    }
    const change = geometryEstimateToAccessChange({
      estimate,
      subjectNodeId: "harbour_civic.entrance_west",
    });
    expect(change.evidenceClass).toBe("device_assisted_estimate");
  });

  it("stores shadow review without publishing or auto-overwrite", () => {
    const scene = getDefaultSyntheticScene();
    const candidate = scene.candidates.find((c) => c.kind === "hazard") ?? scene.candidates[0]!;
    const review = submitVisionCandidateForShadowReview({
      candidate,
      subjectNodeId: "harbour_civic.entrance_west",
    });
    expect(review.autoOverwriteBlocked).toBe(true);
    expect(review.decision).toBe("pending");
    expect(listShadowChangeReviews().length).toBe(1);
    expect(review.notes.some((n) => /not a certified measurement/i.test(n))).toBe(true);
    expect(visionAccessFlags.autoPublish).toBe(false);
  });
});
