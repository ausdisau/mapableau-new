import { describe, expect, it } from "vitest";

import {
  getGoldenPath,
  isFullyExecutable,
  validateGoldenPathContract,
} from "@/lib/release-candidate/golden-paths/registry";

describe("Golden path E - disruption recovery", () => {
  it("validates the recovery contract but blocks full execution on missing Wave 20 invariants", () => {
    const path = getGoldenPath("path-e-disruption-recovery");

    expect(validateGoldenPathContract(path)).toEqual([]);
    expect(isFullyExecutable(path)).toBe(false);
    expect(path.steps.flatMap((step) => step.requiredSafeguards)).toContain(
      "Wave 20 constitutional invariant check",
    );
  });
});
