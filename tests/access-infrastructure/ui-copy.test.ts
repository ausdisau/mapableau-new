import { describe, expect, it } from "vitest";

import {
  COMPATIBILITY_STATUS_WORDS,
  CRITICALITY_LABELS,
  VISIBILITY_LABELS,
  labelForConceptId,
} from "@/lib/access/infrastructure/ui-copy";

describe("AaI ui-copy", () => {
  it("resolves catalog concept ids to human labels", () => {
    expect(labelForConceptId("mobility_movement.step_free")).toBe(
      "Step-free access",
    );
    expect(labelForConceptId("hearing.hearing_augmentation")).toBe(
      "Hearing augmentation",
    );
  });

  it("falls back to title-cased leaf for unknown concept ids", () => {
    expect(labelForConceptId("mobility_movement.ramp_available")).toBe(
      "Ramp Available",
    );
  });

  it("maps criticality and visibility to plain phrases", () => {
    expect(CRITICALITY_LABELS.required).toBe("Must have");
    expect(CRITICALITY_LABELS.strong_preference).toBe("Strong preference");
    expect(VISIBILITY_LABELS.request_scoped).toBe("Share when I approve");
  });

  it("exposes short compatibility status words", () => {
    expect(COMPATIBILITY_STATUS_WORDS.compatible).toBe("Compatible");
    expect(COMPATIBILITY_STATUS_WORDS.compatible_with_adjustment).toBe(
      "Needs adjustment",
    );
    expect(COMPATIBILITY_STATUS_WORDS.uncertain).toBe("Unknown");
    expect(COMPATIBILITY_STATUS_WORDS.incompatible).toBe("Mismatch");
  });
});
