import { describe, expect, it } from "vitest";

import { assertNoForbiddenTargeting } from "@/lib/ads/ad-slot-policy";

describe("ad targeting policy", () => {
  it("rejects forbidden fields in event payloads", () => {
    expect(() =>
      assertNoForbiddenTargeting({ pageContext: "home", diagnosis: "x" }),
    ).toThrow(/Forbidden/);
  });

  it("allows safe contextual fields", () => {
    expect(() =>
      assertNoForbiddenTargeting({
        pageContext: "provider-finder",
        region: "Sydney",
        serviceCategory: "transport",
      }),
    ).not.toThrow();
  });
});
