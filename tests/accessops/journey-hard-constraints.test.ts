import { describe, expect, it } from "vitest";

import { evaluateRoutingPolicy } from "@/lib/accessops/policy/routing-policy";

describe("Journey hard constraints", () => {
  it("denies restricted assets", () => {
    expect(evaluateRoutingPolicy(true, true)).toEqual({
      allowed: false,
      reason: "restricted_asset",
    });
  });
});
