import { describe, expect, it } from "vitest";

import {
  careInvoiceHandoffPath,
  careIncidentHandoffPath,
} from "@/lib/care/pilot-spine";
import {
  isCareIntroductionsEnabled,
  isCareCompareEnabled,
  isCareTransportLinkEnabled,
} from "@/lib/config/care-pilot";
import { retrieveCareBlueprintChunks } from "@/lib/search/care-blueprint-retrieve";
import { CARE_BLUEPRINT_BRAND } from "@/lib/brand/care-blueprint-tokens";

describe("care pilot spine (flag-off defaults)", () => {
  it("keeps introductions/compare/transport link disabled by default", () => {
    expect(isCareIntroductionsEnabled()).toBe(false);
    expect(isCareCompareEnabled()).toBe(false);
    expect(isCareTransportLinkEnabled()).toBe(false);
  });

  it("points invoice and incident handoffs at existing APIs", () => {
    expect(careInvoiceHandoffPath("booking-1")).toBe(
      "/api/care/bookings/booking-1/invoice-placeholder",
    );
    expect(careIncidentHandoffPath()).toBe("/api/care/incidents");
  });

  it("retrieves blueprint invariants from seed without OpenSearch", async () => {
    const hits = await retrieveCareBlueprintChunks(
      "no auto-assignment participant decision",
      3,
    );
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]?.source).toBe("seed");
    expect(
      hits.some((h) => /auto-assign/i.test(h.invariants) || /auto-assign/i.test(h.content)),
    ).toBe(true);
  });

  it("exposes MapAble blueprint brand tokens", () => {
    expect(CARE_BLUEPRINT_BRAND.logoBlue).toBe("#1C5A96");
    expect(CARE_BLUEPRINT_BRAND.logoPurple).toBe("#605B9F");
  });
});
