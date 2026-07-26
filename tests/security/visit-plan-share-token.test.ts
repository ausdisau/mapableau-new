import { describe, expect, it } from "vitest";

import {
  applyRateLimitHeaders,
  enforceIpRateLimit,
} from "@/lib/api/ip-rate-limit";
import {
  generateShareToken,
  isShareTokenFormat,
} from "@/lib/indoor-accessibility/verification/correction-service";

describe("visit plan share token format", () => {
  it("generates a 64-character hex high-entropy token", () => {
    const token = generateShareToken();
    expect(token).toHaveLength(64);
    expect(isShareTokenFormat(token)).toBe(true);
    expect(isShareTokenFormat("not-a-token")).toBe(false);
    expect(isShareTokenFormat("a".repeat(63))).toBe(false);
  });
});

describe("share-link rate limit headers", () => {
  it("emits RateLimit-* headers and eventually blocks", async () => {
    const ip = `test-share-${Math.random().toString(16).slice(2)}`;
    const options = { windowMs: 60_000, max: 2, prefix: "visit-plan-share-test" };

    const first = await enforceIpRateLimit(ip, options);
    expect(first.allowed).toBe(true);
    const second = await enforceIpRateLimit(ip, options);
    expect(second.allowed).toBe(true);
    const third = await enforceIpRateLimit(ip, options);
    expect(third.allowed).toBe(false);

    const headers = new Headers();
    applyRateLimitHeaders(headers, third);
    expect(headers.get("RateLimit-Limit")).toBe("2");
    expect(headers.get("RateLimit-Remaining")).toBe("0");
    expect(headers.get("Retry-After")).toBeTruthy();
  });
});
