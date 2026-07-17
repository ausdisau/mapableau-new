import { describe, expect, it } from "vitest";

import {
  getGoldenPath,
  isFullyExecutable,
  validateGoldenPathContract,
} from "@/lib/release-candidate/golden-paths/registry";

import { buildSyntheticParticipantRequestContext } from "./fixtures/synthetic";

describe("Golden path A - participant onboarding", () => {
  it("validates the synthetic contract and records Wave 20 as blocking execution", () => {
    const context = buildSyntheticParticipantRequestContext();
    const path = getGoldenPath("path-a-participant-onboarding");

    expect(context.tenant.organisationId).toBe("SYNTH_ORG_001");
    expect(validateGoldenPathContract(path)).toEqual([]);
    expect(isFullyExecutable(path)).toBe(false);
    expect(
      path.steps.some((step) =>
        step.blockerIds.includes("wave-20-constitutional-invariants-absent"),
      ),
    ).toBe(true);
  });
});
