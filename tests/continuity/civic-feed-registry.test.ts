import { describe, expect, it } from "vitest";

import { isFeedUsable } from "@/lib/continuity/civic/civic-feed-registry";

function feed(overrides: Partial<any> = {}) {
  return {
    id: "f-1",
    slug: "hospital-bureau",
    displayName: "Hospital bureau",
    provenanceUrl: "https://example.gov",
    status: "approved",
    freshnessTtlMinutes: 60,
    approvedById: "u-1",
    approvedAt: new Date(),
    productionActivated: true,
    detailsJson: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as any;
}

describe("civic feed registry", () => {
  it("disabled by default when nothing registered", () => {
    expect(isFeedUsable(null)).toMatchObject({ usable: false, reason: "not_registered" });
  });

  it("proposed but not activated is not usable", () => {
    const r = isFeedUsable(feed({ status: "proposed", productionActivated: false }));
    expect(r.usable).toBe(false);
    expect(r.reason).toBe("not_activated");
  });

  it("approved + activated is usable", () => {
    const r = isFeedUsable(feed());
    expect(r.usable).toBe(true);
  });

  it("suspended feed is not usable", () => {
    const r = isFeedUsable(feed({ status: "suspended" }));
    expect(r.usable).toBe(false);
  });
});
