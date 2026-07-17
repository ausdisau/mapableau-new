import { describe, expect, it } from "vitest";

import {
  evaluateExceptionUsability,
  exceptionsSupportApproval,
} from "@/lib/assurance/exceptions/exception-service";
import { deriveOperatingEffectiveness } from "@/lib/assurance/testing/operating-effectiveness";

describe("control test results", () => {
  it("failed tests block readiness", () => {
    const result = deriveOperatingEffectiveness(["pass", "fail"]);
    expect(result.effective).toBe(false);
    expect(result.blocksReadiness).toBe(true);
  });

  it("all pass is effective", () => {
    const result = deriveOperatingEffectiveness(["pass", "pass"]);
    expect(result.effective).toBe(true);
    expect(result.blocksReadiness).toBe(false);
  });
});

describe("exceptions", () => {
  it("empty exceptions do not support approval", () => {
    expect(exceptionsSupportApproval([])).toBe(false);
  });

  it("expired exceptions are not usable", () => {
    const usability = evaluateExceptionUsability({
      status: "approved",
      expiresAt: new Date("2020-01-01T00:00:00Z"),
      revokedAt: null,
    });
    expect(usability.usable).toBe(false);
    expect(usability.reason).toBe("exception_expired");
  });
});
