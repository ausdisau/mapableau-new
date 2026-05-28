import { describe, expect, it } from "vitest";

import {
  CARE_ALLOCATION_CAPABILITY_MATRIX,
  assertCareAllocationCapability,
} from "@/lib/care-allocation/governance";
import { proposalStatusFromGate } from "@/lib/care-allocation/gates";
import {
  allocationConfig,
  resolveAutonomyTier,
} from "@/lib/config/allocation";
import { AV_CAPABILITY_MATRIX } from "@/lib/av-framework/governance";

describe("care allocation governance", () => {
  it("allows recommend and conditional auto", () => {
    expect(CARE_ALLOCATION_CAPABILITY_MATRIX.recommend_workers.allowed).toBe(
      true
    );
    expect(
      CARE_ALLOCATION_CAPABILITY_MATRIX.conditional_auto_assign.allowed
    ).toBe(true);
    expect(
      CARE_ALLOCATION_CAPABILITY_MATRIX.unconditional_auto_assign.allowed
    ).toBe(false);
  });

  it("denies unconditional auto assign capability", () => {
    expect(() =>
      assertCareAllocationCapability("unconditional_auto_assign")
    ).toThrow("CARE_ALLOCATION_CAPABILITY_DENIED");
  });

  it("does not enable transport autonomous_assignment", () => {
    expect(AV_CAPABILITY_MATRIX.autonomous_assignment.allowed).toBe(false);
    expect(AV_CAPABILITY_MATRIX.autonomous_dispatch.allowed).toBe(false);
  });
});

describe("allocation config", () => {
  it("defaults to recommend_only tier", () => {
    expect(resolveAutonomyTier(null)).toBe("recommend_only");
  });

  it("respects conditional_auto env when set", () => {
    const prev = allocationConfig.autonomyTier;
    Object.assign(allocationConfig, { autonomyTier: "conditional_auto" });
    expect(resolveAutonomyTier(null)).toBe("conditional_auto");
    Object.assign(allocationConfig, { autonomyTier: prev });
  });
});

describe("proposal status from gates", () => {
  it("maps passed top rank to auto_eligible", () => {
    expect(proposalStatusFromGate("passed", 1)).toBe("auto_eligible");
  });

  it("maps recommend_only path to review_required for top rank", () => {
    expect(proposalStatusFromGate("review_required", 1)).toBe(
      "review_required"
    );
  });

  it("maps blocked to blocked", () => {
    expect(proposalStatusFromGate("blocked", 1)).toBe("blocked");
  });
});
