import { describe, expect, it } from "vitest";

import {
  getGoldenPath,
  isFullyExecutable,
  validateGoldenPathContract,
} from "@/lib/release-candidate/golden-paths/registry";

describe("Golden path D - transport service", () => {
  it("documents transport as synthetic until Wave 20 and approved live routing exist", () => {
    const path = getGoldenPath("path-d-transport-service");

    expect(validateGoldenPathContract(path)).toEqual([]);
    expect(isFullyExecutable(path)).toBe(false);
    expect(path.steps.flatMap((step) => step.blockerIds)).toContain(
      "wave-20-constitutional-invariants-absent",
    );
  });
});
