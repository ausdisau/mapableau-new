import { describe, expect, it } from "vitest";

import {
  getGoldenPath,
  isFullyExecutable,
  validateGoldenPathContract,
} from "@/lib/release-candidate/golden-paths/registry";

describe("Golden path C - care service", () => {
  it("keeps care service executable only up to the missing Wave 16 allocation dependency", () => {
    const path = getGoldenPath("path-c-care-service");

    expect(validateGoldenPathContract(path)).toEqual([]);
    expect(isFullyExecutable(path)).toBe(false);
    expect(path.steps.map((step) => step.status)).toContain(
      "blocked_missing_wave",
    );
    expect(path.steps.flatMap((step) => step.prohibitedActions)).toContain(
      "automatic payment or claim approval",
    );
  });
});
