import { describe, expect, it } from "vitest";

import { evaluateRoutingPolicy } from "@/lib/accessops/policy/routing-policy";
import { evaluateStatusPolicy } from "@/lib/accessops/policy/status-policy";

describe("AccessOps deny-default policy", () => {
  it("denies missing routing and status policy", () => {
    expect(evaluateRoutingPolicy(false, false).allowed).toBe(false);
    expect(evaluateStatusPolicy(false).allowed).toBe(false);
  });
});
