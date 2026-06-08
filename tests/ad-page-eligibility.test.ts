import { describe, expect, it } from "vitest";

import {
  isEligibleAdRoute,
  isSensitiveRoute,
  pageContextFromPath,
} from "@/lib/ads/ad-page-eligibility";

describe("ad-page-eligibility", () => {
  it("blocks sensitive routes", () => {
    expect(isSensitiveRoute("/login")).toBe(true);
    expect(isSensitiveRoute("/dashboard/bookings")).toBe(true);
    expect(isSensitiveRoute("/admin/analytics")).toBe(true);
  });

  it("allows public marketing routes", () => {
    expect(isEligibleAdRoute("/")).toBe(true);
    expect(isEligibleAdRoute("/provider-finder")).toBe(true);
    expect(isEligibleAdRoute("/core")).toBe(true);
  });

  it("blocks ads on sensitive routes", () => {
    expect(isEligibleAdRoute("/login")).toBe(false);
    expect(isEligibleAdRoute("/dashboard")).toBe(false);
  });

  it("derives page context from path", () => {
    expect(pageContextFromPath("/")).toBe("home");
    expect(pageContextFromPath("/provider-finder/results")).toBe("provider-finder");
  });
});
