import { describe, expect, it } from "vitest";

import {
  getGoldenPath,
  isFullyExecutable,
  validateGoldenPathContract,
} from "@/lib/release-candidate/golden-paths/registry";

describe("Golden path G - complaint and appeal", () => {
  it("documents appeal safeguards and blocks full execution until Wave 20 lands", () => {
    const path = getGoldenPath("path-g-complaint-appeal");

    expect(validateGoldenPathContract(path)).toEqual([]);
    expect(isFullyExecutable(path)).toBe(false);
    expect(path.steps.flatMap((step) => step.requiredSafeguards)).toContain(
      "auditability",
    );
  });
});
