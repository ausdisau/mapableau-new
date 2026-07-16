import { describe, expect, it } from "vitest";

import {
  filterProvidersByAvailability,
  isAvailableThisWeek,
  waitlistLabel,
} from "@/lib/wedges/availability/filters";
import { MOCK_WEDGE_PROVIDERS } from "@/lib/wedges/mock-providers";

describe("availability filters", () => {
  it("filters by no waitlist", () => {
    const result = filterProvidersByAvailability(MOCK_WEDGE_PROVIDERS, {
      noWaitlist: true,
    });
    expect(result.every((p) => p.availability.waitlistStatus === "none")).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("filters by telehealth", () => {
    const result = filterProvidersByAvailability(MOCK_WEDGE_PROVIDERS, {
      telehealth: true,
    });
    expect(result.every((p) => p.availability.telehealthAvailable)).toBe(true);
  });

  it("filters by suburb", () => {
    const result = filterProvidersByAvailability(MOCK_WEDGE_PROVIDERS, {
      suburb: "Parramatta",
    });
    expect(result.some((p) => p.suburb === "Parramatta")).toBe(true);
  });

  it("detects available this week", () => {
    const available = MOCK_WEDGE_PROVIDERS[0].availability;
    expect(isAvailableThisWeek(available)).toBe(true);
  });

  it("labels waitlist statuses", () => {
    expect(waitlistLabel("none")).toBe("No waitlist");
    expect(waitlistLabel("closed")).toBe("Not accepting new participants");
  });
});
