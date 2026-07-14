
import { describe, expect, it } from "vitest";
import { validateDeepLink } from "../../../apps/mobile/src/security/deep-link";

describe("deep link validation", () => {
  it("allows MapAble hosts and scheme", () => {
    expect(validateDeepLink("https://mapable.com.au/app/today").ok).toBe(true);
    expect(validateDeepLink("mapable://today").ok).toBe(true);
  });

  it("rejects altered hosts", () => {
    const result = validateDeepLink("https://evil.example/app/today");
    expect(result.ok).toBe(false);
  });
});
