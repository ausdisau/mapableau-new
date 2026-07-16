import { describe, expect, it } from "vitest";

import { buildPtvSignature } from "@/lib/ptv/client";

describe("PTV client signature", () => {
  it("generates uppercase HMAC-SHA1 signature", () => {
    const signature = buildPtvSignature("/v3/route_types", "12345", "test-api-key");
    expect(signature).toMatch(/^[A-F0-9]+$/);
    expect(signature.length).toBeGreaterThan(0);
  });

  it("is deterministic for the same inputs", () => {
    const a = buildPtvSignature("/v3/search/Sydney", "99", "secret");
    const b = buildPtvSignature("/v3/search/Sydney", "99", "secret");
    expect(a).toBe(b);
  });
});
