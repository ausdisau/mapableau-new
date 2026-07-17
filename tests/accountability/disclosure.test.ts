import { describe, expect, it } from "vitest";

import {
  applyCohortSuppression,
  describeTrend,
} from "@/lib/accountability/disclosure";
import { DEFAULT_PUBLIC_COHORT_THRESHOLD } from "@/lib/config/accountability";

describe("accountability cohort suppression", () => {
  it("uses default threshold of 10", () => {
    expect(DEFAULT_PUBLIC_COHORT_THRESHOLD).toBe(10);
  });

  it("suppresses values below cohort threshold and does not return zero", () => {
    const result = applyCohortSuppression(7, 7, { minimumCohortSize: 10 });
    expect(result.suppressed).toBe(true);
    expect(result.value).toBeNull();
    expect(result.roundedValue).toBeNull();
    expect(result.notice).toMatch(/too small to protect privacy/i);
  });

  it("does not suppress zero or null sample sizes incorrectly for large cohorts", () => {
    const result = applyCohortSuppression(100, 42, { minimumCohortSize: 10 });
    expect(result.suppressed).toBe(false);
    expect(result.value).toBe(42);
  });

  it("rounds when configured", () => {
    const result = applyCohortSuppression(100, 43, {
      minimumCohortSize: 10,
      roundToNearest: 5,
    });
    expect(result.roundedValue).toBe(45);
  });
});

describe("trend description", () => {
  it("describes increase and decrease", () => {
    expect(describeTrend(10, 8)).toMatch(/increased/i);
    expect(describeTrend(8, 10)).toMatch(/decreased/i);
    expect(describeTrend(10, 10)).toMatch(/no change/i);
  });
});
