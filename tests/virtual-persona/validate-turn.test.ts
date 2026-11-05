import { describe, expect, it } from "vitest";

import { SYNTHETIC_PUBLIC_INFO_TURN } from "@/lib/virtual-persona/fixtures";
import { corruptPersonaTurnForTests } from "@/lib/virtual-persona/synthetic-adapter";
import { validatePersonaTurn } from "@/lib/virtual-persona/validate-turn";

describe("validatePersonaTurn", () => {
  it("accepts synthetic fixture turns with actionAuthority none", () => {
    const result = validatePersonaTurn(SYNTHETIC_PUBLIC_INFO_TURN("t1"));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.turn.actionAuthority).toBe("none");
    }
  });

  it("rejects corrupted authority", () => {
    const bad = corruptPersonaTurnForTests(SYNTHETIC_PUBLIC_INFO_TURN("t2"));
    const result = validatePersonaTurn(bad);
    expect(result.ok).toBe(false);
  });
});
