import { describe, expect, it } from "vitest";

import {
  buildSubscriptionSummaryLabel,
  formatSubscriptionPlanLabel,
  formatSubscriptionStatusLabel,
} from "@/lib/providers/provider-cloud-context";

describe("provider cloud subscription labels", () => {
  it("formats provider pro plan name", () => {
    expect(formatSubscriptionPlanLabel("provider_pro")).toBe("Provider Pro");
  });

  it("formats incomplete subscription status", () => {
    expect(formatSubscriptionStatusLabel("incomplete")).toBe("Setup in progress");
  });

  it("combines active plan without redundant status", () => {
    expect(buildSubscriptionSummaryLabel("provider_pro", "active")).toBe("Provider Pro");
  });

  it("shows plan and status when not active", () => {
    expect(buildSubscriptionSummaryLabel("provider_pro", "past_due")).toBe(
      "Provider Pro · Past due"
    );
  });

  it("handles missing subscription", () => {
    expect(buildSubscriptionSummaryLabel(null, null)).toBe("Not subscribed");
  });
});
