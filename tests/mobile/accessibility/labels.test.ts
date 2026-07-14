
import { describe, expect, it } from "vitest";
import {
  PLAIN_LANGUAGE_STATUS,
  minTouchTarget,
  statusWithoutColourOnly,
  DEFAULT_A11Y_PREFERENCES,
} from "@mapable/accessibility";

describe("accessibility utilities", () => {
  it("keeps touch targets at least 48", () => {
    expect(minTouchTarget(DEFAULT_A11Y_PREFERENCES)).toBeGreaterThanOrEqual(48);
  });

  it("does not rely on colour alone", () => {
    expect(statusWithoutColourOnly("Shift", "unconfirmed")).toContain("unconfirmed");
  });

  it("exposes plain language statuses", () => {
    expect(PLAIN_LANGUAGE_STATUS.needs_decision).toMatch(/decide/i);
  });
});
