import { describe, expect, it } from "vitest";

import {
  getGoldenPath,
  isFullyExecutable,
  validateGoldenPathContract,
} from "@/lib/release-candidate/golden-paths/registry";

describe("Golden path F - access journey", () => {
  it("keeps AccessOps journey planning advisory and blocked for live RC execution", () => {
    const path = getGoldenPath("path-f-access-journey");

    expect(validateGoldenPathContract(path)).toEqual([]);
    expect(isFullyExecutable(path)).toBe(false);
    expect(path.steps.flatMap((step) => step.prohibitedActions)).toContain(
      "production integration activation",
    );
  });
});
