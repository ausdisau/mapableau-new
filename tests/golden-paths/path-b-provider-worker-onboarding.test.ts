import { describe, expect, it } from "vitest";

import {
  getGoldenPath,
  isFullyExecutable,
  validateGoldenPathContract,
} from "@/lib/release-candidate/golden-paths/registry";

describe("Golden path B - provider worker onboarding", () => {
  it("marks missing Wave 16 workforce authority as a blocker", () => {
    const path = getGoldenPath("path-b-provider-worker-onboarding");

    expect(validateGoldenPathContract(path)).toEqual([]);
    expect(isFullyExecutable(path)).toBe(false);
    expect(
      path.steps.some((step) => step.blockerIds.includes("waves-14-16-absent")),
    ).toBe(true);
    expect(
      path.steps.some((step) => step.blockerIds.includes("pack-a-incomplete")),
    ).toBe(true);
  });
});
