import { describe, expect, it } from "vitest";

import { evaluateA2AAccess } from "@/lib/aura/protocols/a2a/gateway";

describe("A2A gateway", () => {
  it("A2A is disabled by default", () => {
    const v = evaluateA2AAccess({
      peerLabel: "any",
      entitlementKeyProvided: "any",
      registry: [],
    });
    expect(v.verdict).toBe("disabled");
  });
});
