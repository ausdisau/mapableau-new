import { describe, expect, it } from "vitest";

import {
  isLimitedLivePermitted,
  isOperationAllowedAtStage,
} from "@/lib/pilot/policy/stage-policy";

describe("pilot stage policy", () => {
  it("blocks limited_live by default without assurance refs", () => {
    const result = isLimitedLivePermitted({
      stage: "limited_live",
      limitedLiveEnabled: false,
      assuranceAssessmentId: null,
      goLiveAssessmentId: null,
    });
    expect(result.ok).toBe(false);
    expect(result.reasons).toContain("LIMITED_LIVE_DISABLED_BY_DEFAULT");
    expect(result.reasons).toContain("ASSURANCE_ASSESSMENT_REQUIRED");
    expect(result.reasons).toContain("GO_LIVE_ASSESSMENT_REQUIRED");
  });

  it("allows limited_live only when enabled and assurance present", () => {
    const result = isLimitedLivePermitted({
      stage: "limited_live",
      limitedLiveEnabled: true,
      assuranceAssessmentId: "assurance-1",
      goLiveAssessmentId: "golive-1",
    });
    expect(result.ok).toBe(true);
  });

  it("denies execute_transaction in design stage", () => {
    expect(isOperationAllowedAtStage("design", "execute_transaction")).toBe(
      false
    );
    expect(isOperationAllowedAtStage("sandbox", "execute_transaction")).toBe(
      true
    );
  });
});
