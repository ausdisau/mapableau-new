import { describe, expect, it } from "vitest";

import {
  getGoldenPath,
  isFullyExecutable,
  validateGoldenPathContract,
} from "@/lib/release-candidate/golden-paths/registry";

describe("Golden path H - data rights and exit", () => {
  it("keeps data rights synthetic and blocks full execution on missing Wave 20 invariants", () => {
    const path = getGoldenPath("path-h-data-rights-exit");

    expect(validateGoldenPathContract(path)).toEqual([]);
    expect(isFullyExecutable(path)).toBe(false);
    expect(path.participantDataPolicy).toBe("synthetic-only");
  });
});
