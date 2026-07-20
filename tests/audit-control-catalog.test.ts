import { describe, expect, it } from "vitest";

import {
  ALL_AUDIT_CONTROLS,
  IRAP_ISM_CONTROLS,
  SOC2_CONTROLS,
  controlsByTrack,
  controlsWithOpenGaps,
} from "@/lib/compliance-evidence/audit-control-catalog";

describe("audit control catalog", () => {
  it("defines SOC 2 and IRAP tracks", () => {
    expect(SOC2_CONTROLS.length).toBeGreaterThanOrEqual(10);
    expect(IRAP_ISM_CONTROLS.length).toBeGreaterThanOrEqual(10);
    expect(ALL_AUDIT_CONTROLS.length).toBe(
      SOC2_CONTROLS.length + IRAP_ISM_CONTROLS.length
    );
  });

  it("uses unique control codes", () => {
    const codes = ALL_AUDIT_CONTROLS.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("crosswalk references resolve within catalog", () => {
    const codes = new Set(ALL_AUDIT_CONTROLS.map((c) => c.code));
    for (const control of ALL_AUDIT_CONTROLS) {
      if (control.crosswalk) {
        expect(codes.has(control.crosswalk)).toBe(true);
      }
    }
  });

  it("each control has evidence paths and test procedure", () => {
    for (const control of ALL_AUDIT_CONTROLS) {
      expect(control.evidencePaths.length).toBeGreaterThan(0);
      expect(control.testProcedure.length).toBeGreaterThan(0);
      expect(control.owner.length).toBeGreaterThan(0);
    }
  });

  it("filters by track and open gaps", () => {
    expect(controlsByTrack("soc2").every((c) => c.track === "soc2")).toBe(true);
    expect(controlsByTrack("irap").every((c) => c.track === "irap")).toBe(true);
    expect(controlsWithOpenGaps().length).toBeGreaterThan(0);
  });
});
