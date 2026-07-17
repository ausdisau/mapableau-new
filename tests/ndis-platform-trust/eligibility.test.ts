import { describe, expect, it } from "vitest";

import { sourceUnavailableMeansClear } from "@/lib/ndis-platform-trust/banning-orders/banning-policy";
import { selfDeclaredEqualsVerified } from "@/lib/ndis-platform-trust/credentials/credential-policy";
import { deriveEligibilityStatus } from "@/lib/ndis-platform-trust/eligibility/eligibility-service";
import { pendingClearanceIsEligible } from "@/lib/ndis-platform-trust/worker-clearance/clearance-policy";

describe("worker platform eligibility", () => {
  it("pending clearance is not eligible", () => {
    expect(pendingClearanceIsEligible("pending")).toBe(false);
    const derived = deriveEligibilityStatus({
      clearanceStatus: "pending",
      banningStatus: "clear",
    });
    expect(derived.status).toBe("pending_clearance");
    expect(derived.blocksPlatformWork).toBe(true);
  });

  it("banning source_unavailable is not clear", () => {
    expect(sourceUnavailableMeansClear("source_unavailable")).toBe(false);
    const derived = deriveEligibilityStatus({
      clearanceStatus: "verified",
      banningStatus: "source_unavailable",
    });
    expect(derived.status).toBe("source_unavailable");
    expect(derived.blocksPlatformWork).toBe(true);
  });

  it("self_declared is not verified", () => {
    expect(selfDeclaredEqualsVerified("self_declared")).toBe(false);
    const derived = deriveEligibilityStatus({
      clearanceStatus: "self_declared",
      banningStatus: "clear",
    });
    expect(derived.status).toBe("ineligible");
  });
});
