import { describe, expect, it } from "vitest";

import {
  assertFundingRouteAllowed,
  assertSupportItemAllowed,
  isFundingRouteAllowed,
  isSupportItemAllowed,
} from "@/lib/pilot/policy/allowlist";

describe("pilot allowlists fail closed", () => {
  it("empty support item allowlist denies", () => {
    expect(isSupportItemAllowed([], "01_011_0107_1_1")).toBe(false);
    expect(() => assertSupportItemAllowed([], "01_011_0107_1_1")).toThrow(
      /SUPPORT_ITEM_ALLOWLIST_EMPTY_DENY/
    );
  });

  it("empty funding route allowlist denies", () => {
    expect(isFundingRouteAllowed([], "ndis_plan_managed")).toBe(false);
    expect(() => assertFundingRouteAllowed([], "ndis_plan_managed")).toThrow(
      /FUNDING_ROUTE_ALLOWLIST_EMPTY_DENY/
    );
  });

  it("allowlisted values pass", () => {
    expect(isSupportItemAllowed(["01_011_0107_1_1"], "01_011_0107_1_1")).toBe(
      true
    );
    expect(
      isFundingRouteAllowed(["ndis_plan_managed"], "ndis_plan_managed")
    ).toBe(true);
  });
});
