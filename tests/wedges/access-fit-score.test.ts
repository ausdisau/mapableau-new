import { describe, expect, it } from "vitest";

import { accessFitScore, accessFitLevelLabel } from "@/lib/access-fit/score";
import type { AccessNeedId } from "@/types/wedges";

describe("accessFitScore", () => {
  it("returns strong fit when no needs specified", () => {
    const result = accessFitScore({}, { wheelchairAccess: true });
    expect(result.level).toBe("strong_fit");
    expect(result.score).toBe(100);
  });

  it("matches when provider supports all needs", () => {
    const needs = { wheelchairAccess: true, stepFreeEntry: true };
    const caps = { wheelchairAccess: true, stepFreeEntry: true };
    const result = accessFitScore(needs, caps);
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.level).toBe("strong_fit");
    expect(result.hardBarriers).toHaveLength(0);
  });

  it("identifies hard barriers", () => {
    const needs = { stepFreeEntry: true };
    const caps = { stepFreeEntry: false };
    const result = accessFitScore(needs, caps);
    expect(result.hardBarriers).toContain("stepFreeEntry");
    expect(result.level).toBe("likely_barrier");
  });

  it("treats unknown capabilities as partial score", () => {
    const needs = { auslan: true };
    const caps: Partial<Record<AccessNeedId, boolean | null>> = { auslan: null };
    const result = accessFitScore(needs, caps);
    expect(result.unknowns).toContain("auslan");
    expect(result.recommendedQuestions.length).toBeGreaterThan(0);
  });

  it("labels all access fit levels", () => {
    expect(accessFitLevelLabel("strong_fit")).toBe("Strong fit");
    expect(accessFitLevelLabel("likely_barrier")).toBe("Likely barrier");
  });
});
