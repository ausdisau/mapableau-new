import { describe, expect, it } from "vitest";
import {
  FULL_LIFE_ASSURANCE_DIMENSIONS,
  FULL_LIFE_HARNESS_DECISIONS,
  FULL_LIFE_HARNESS_VERSION,
  FULL_LIFE_RULE_IDS,
} from "@/lib/platform/full-life";

describe("Full Life contracts", () => {
  it("publishes FL-001 through FL-012 exactly", () => {
    expect(FULL_LIFE_RULE_IDS).toEqual(
      Array.from({ length: 12 }, (_, i) =>
        `FL-${String(i + 1).padStart(3, "0")}`,
      ),
    );
  });

  it("uses the approved categorical decisions", () => {
    expect(FULL_LIFE_HARNESS_DECISIONS).toEqual([
      "PRESENT",
      "PROPOSE",
      "REVIEW_REQUIRED",
      "DEGRADE_TO_MANUAL",
      "BLOCK_EXECUTION",
      "STOP_AND_ESCALATE",
    ]);
  });

  it("starts in harness contract version 0.1.0", () => {
    expect(FULL_LIFE_HARNESS_VERSION).toBe("0.1.0");
  });

  it("contains no aggregate score dimension", () => {
    expect(FULL_LIFE_ASSURANCE_DIMENSIONS.join(" ").toLowerCase()).not.toContain(
      "score",
    );
  });
});
