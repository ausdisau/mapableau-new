import { describe, expect, it } from "vitest";

import {
  hasAllRequiredApprovals,
  missingApprovals,
  requiredApprovalsFor,
} from "@/lib/releases/approvals";
import {
  isPromotable,
  nextRing,
  RELEASE_RING_ORDER,
  ringIndex,
} from "@/lib/releases/rings";

describe("release rings (Wave 8)", () => {
  it("ring order is fixed", () => {
    expect(RELEASE_RING_ORDER).toEqual([
      "ring_0_internal",
      "ring_1_canary",
      "ring_2_pilot",
      "ring_3_general_limited",
      "ring_4_general",
    ]);
    expect(ringIndex("ring_2_pilot")).toBe(2);
  });

  it("only permits step-by-step promotion", () => {
    expect(isPromotable("ring_0_internal", "ring_1_canary")).toBe(true);
    expect(isPromotable("ring_0_internal", "ring_2_pilot")).toBe(false);
    expect(nextRing("ring_4_general")).toBeNull();
  });

  it("required approvals expand as rings grow", () => {
    expect(requiredApprovalsFor("ring_0_internal")).toEqual(["engineering"]);
    expect(requiredApprovalsFor("ring_4_general")).toEqual([
      "engineering",
      "safety",
      "privacy",
      "security",
      "executive",
    ]);
  });

  it("hasAllRequiredApprovals fails when any kind is missing", () => {
    const approvals = [
      {
        kind: "engineering" as const,
        userId: "u1",
        approvedAt: new Date().toISOString(),
      },
    ];
    expect(hasAllRequiredApprovals("ring_1_canary", approvals)).toBe(false);
    expect(missingApprovals("ring_1_canary", approvals)).toEqual(["safety"]);
  });

  it("hasAllRequiredApprovals passes when all kinds present", () => {
    const approvals = ["engineering", "safety", "privacy"].map((k) => ({
      kind: k as "engineering" | "safety" | "privacy",
      userId: "u1",
      approvedAt: new Date().toISOString(),
    }));
    expect(hasAllRequiredApprovals("ring_2_pilot", approvals)).toBe(true);
  });
});
