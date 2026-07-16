import { describe, expect, it } from "vitest";

import {
  VISION_ACCESS_DISCLAIMER,
  VISION_AUDIT_EVENTS,
  VISION_MEASUREMENT_CLASS_LABELS,
  VISION_PERMANENT_OFF_FLAGS,
  VISION_PROHIBITED_OUTPUTS,
  assertCandidateTransition,
  assertDangerousVisionFlagsOff,
  buildSyntheticEvidenceBundle,
  canTransitionCandidate,
  formatProvisionalIntervalMm,
  getCapturePurpose,
  getDefaultSyntheticScene,
  getSortedCandidates,
  isForbiddenElevation,
  isVisionSyntheticDemoAvailable,
  listVisionAccessFlagStates,
  listWave1CapturePurposes,
  measurementClaimAllowed,
  resolveCapabilityTier,
  syntheticDemoDeviceProfile,
  transitionCandidate,
  visionAccessFlags,
} from "@/lib/vision-access";

describe("vision access feature flags", () => {
  it("defaults dangerous capabilities to false", () => {
    const flags = listVisionAccessFlagStates();
    for (const key of VISION_PERMANENT_OFF_FLAGS) {
      expect(flags[key]).toBe(false);
    }
    expect(visionAccessFlags.autoPublish).toBe(false);
    expect(visionAccessFlags.liveAdvisory).toBe(false);
    expect(visionAccessFlags.evidenceUpload).toBe(false);
    expect(visionAccessFlags.depth).toBe(false);
  });

  it("assertDangerousVisionFlagsOff passes with safe defaults", () => {
    expect(() => assertDangerousVisionFlagsOff()).not.toThrow();
  });

  it("exposes synthetic demo in test environment", () => {
    expect(isVisionSyntheticDemoAvailable()).toBe(true);
  });
});

describe("candidate state machine", () => {
  it("allows detected to participant_review", () => {
    expect(canTransitionCandidate("detected", "participant_review")).toBe(true);
    expect(transitionCandidate("detected", "participant_review")).toBe(
      "participant_review",
    );
  });

  it("forbids detected to verified", () => {
    expect(canTransitionCandidate("detected", "verified")).toBe(false);
    expect(isForbiddenElevation("detected", "verified")).toBe(true);
    expect(() => assertCandidateTransition("detected", "verified")).toThrow(
      /VISION_CANDIDATE_TRANSITION_FORBIDDEN/,
    );
  });

  it("forbids tracked to verified", () => {
    expect(canTransitionCandidate("tracked", "verified")).toBe(false);
    expect(isForbiddenElevation("tracked", "verified")).toBe(true);
  });

  it("requires confirmation before submit", () => {
    expect(canTransitionCandidate("participant_review", "submitted")).toBe(false);
    expect(canTransitionCandidate("participant_confirmed", "submitted")).toBe(true);
  });

  it("allows verified only from moderation path", () => {
    expect(canTransitionCandidate("moderation_pending", "verified")).toBe(true);
    expect(canTransitionCandidate("corroborated", "verified")).toBe(true);
    expect(canTransitionCandidate("low_confidence", "verified")).toBe(false);
  });
});

describe("measurement classes", () => {
  it("labels visual inference as none claim", () => {
    expect(measurementClaimAllowed("visual_inference")).toBe("none");
    expect(VISION_MEASUREMENT_CLASS_LABELS.visual_inference).toMatch(/no geometric/i);
  });

  it("keeps hardware depth provisional", () => {
    expect(measurementClaimAllowed("hardware_depth_estimate")).toBe("provisional");
  });

  it("formats intervals without false precision", () => {
    expect(formatProvisionalIntervalMm(847.32, 882.7)).toBe(
      "approximately 850 to 880 mm",
    );
  });
});

describe("device capability", () => {
  it("synthetic demo is tier 0 without camera", () => {
    const profile = syntheticDemoDeviceProfile();
    expect(profile.capabilityTier).toBe(0);
    expect(profile.cameraPermission).toBe("not_requested");
    expect(resolveCapabilityTier(profile)).toBe(0);
  });

  it("resolves tier 2 when on-device runtime present", () => {
    expect(
      resolveCapabilityTier({
        cameraSupported: true,
        cameraPermission: "granted",
        depthSupport: "none",
        sceneReconstructionSupport: false,
        modelRuntime: "core_ml",
      }),
    ).toBe(2);
  });
});

describe("capture purposes", () => {
  it("only synthetic_demo is wave1 available", () => {
    const wave1 = listWave1CapturePurposes();
    expect(wave1).toHaveLength(1);
    expect(wave1[0]?.purpose).toBe("vision.synthetic_demo");
    expect(wave1[0]?.offersUpload).toBe(false);
    expect(wave1[0]?.mayStoreMedia).toBe(false);
  });

  it("entrance capture does not imply upload without confirm path", () => {
    const entrance = getCapturePurpose("vision.capture_entrance");
    expect(entrance.offersUpload).toBe(true);
    expect(entrance.wave1Available).toBe(false);
    expect(entrance.defaultRetention).toBe("participant_selected");
  });
});

describe("synthetic harbour civic fixtures", () => {
  it("provides sorted provisional candidates", () => {
    const scene = getDefaultSyntheticScene();
    expect(scene.placeName).toMatch(/Harbour Civic/i);
    const sorted = getSortedCandidates(scene.candidates);
    expect(sorted.length).toBeGreaterThanOrEqual(4);
    expect(sorted[0]?.listPriority).toBeLessThanOrEqual(sorted[1]?.listPriority ?? 99);
    for (const c of sorted) {
      expect(c.exactMeasurementAvailable).toBe(false);
      expect(c.requiresHumanConfirmation).toBe(true);
      expect(c.source).toBe("deterministic_fixture");
      expect(["participant_review", "low_confidence"]).toContain(c.state);
    }
  });

  it("evidence bundle never claims truth or attaches media", () => {
    const bundle = buildSyntheticEvidenceBundle();
    expect(bundle.provesClaimTruth).toBe(false);
    expect(bundle.mediaReferences).toEqual([]);
    expect(bundle.privacyRedaction.identityMatchingPerformed).toBe(false);
    expect(bundle.retention).toBe("none");
    expect(bundle.locationPrecision).toBe("none");
  });

  it("geometry estimate is provisional visual inference", () => {
    const geo = getDefaultSyntheticScene().geometryEstimates[0];
    expect(geo?.provisional).toBe(true);
    expect(geo?.notACertifiedMeasurement).toBe(true);
    expect(geo?.method).toBe("visual_inference");
    expect(geo?.valueLow).toBeNull();
  });

  it("includes safety disclaimer language", () => {
    expect(VISION_ACCESS_DISCLAIMER).toMatch(/candidates only/i);
    expect(VISION_ACCESS_DISCLAIMER).toMatch(/not certified measurements/i);
    expect(VISION_ACCESS_DISCLAIMER).toMatch(/white cane/i);
    expect(VISION_ACCESS_DISCLAIMER).toMatch(/guide dog/i);
    expect(VISION_PROHIBITED_OUTPUTS).toContain("facial_identity");
    expect(VISION_PROHIBITED_OUTPUTS).toContain("disability_inference");
  });
});

describe("audit events", () => {
  it("defines safe session and candidate event names", () => {
    expect(VISION_AUDIT_EVENTS.sessionStarted).toBe("vision.session_started");
    expect(VISION_AUDIT_EVENTS.candidateConfirmed).toBe("vision.candidate_confirmed");
    expect(VISION_AUDIT_EVENTS.syntheticDemoViewed).toBe("vision.synthetic_demo_viewed");
  });
});
