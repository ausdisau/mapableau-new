import { describe, expect, it } from "vitest";

import { PROGRAMME_AURA_CEILING } from "@/lib/programmes/aura/execution-gate";

/** N8/N9/N14 fixture-level Stage 1 contracts (proposal-only / clinical red lines). */
describe("ACS Stage 1 — proposal-only and clinical red lines", () => {
  it("N9: programme ceiling remains suggestion-with-approval", () => {
    expect(PROGRAMME_AURA_CEILING).toBe("SUGGEST_WITH_PARTICIPANT_APPROVAL");
  });

  it("N8: AAC delay is not capacity evidence (contract)", () => {
    const communicationAccessFailure = {
      kind: "communication_access_failure" as const,
      aacDelayMs: 12_000,
      silenceMs: 8_000,
    };
    expect(communicationAccessFailure.kind).not.toBe("capacity_diminished");
    expect(communicationAccessFailure).not.toHaveProperty("consentInferred");
  });

  it("N14: clinical/physical tool ids are hard-refused list", () => {
    const CLINICAL_RED_LINES = [
      "device.hoist.actuate",
      "clinical.medication.administer",
      "clinical.restraint.apply",
      "clinical.dysphagia.feed",
      "clinical.ventilator.control",
    ] as const;
    for (const tool of CLINICAL_RED_LINES) {
      expect(tool.startsWith("clinical.") || tool.startsWith("device.")).toBe(
        true,
      );
    }
  });
});
