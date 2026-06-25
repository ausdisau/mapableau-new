import { describe, expect, it } from "vitest";

import {
  bucketLocation,
  sanitizeAnalyticsProperties,
} from "@/lib/analytics/product-analytics";

describe("analytics sanitisation", () => {
  it("strips sensitive keys", () => {
    const sanitized = sanitizeAnalyticsProperties({
      form_type: "early_access",
      accessNeeds: "wheelchair",
      ndisNumber: "123",
      message: "private note",
    });
    expect(sanitized.form_type).toBe("early_access");
    expect(sanitized.accessNeeds).toBeUndefined();
    expect(sanitized.ndisNumber).toBeUndefined();
    expect(sanitized.message).toBeUndefined();
  });

  it("buckets location to broad region", () => {
    expect(bucketLocation("Parramatta NSW 2150")).toMatch(/postcode_21xx|2150|parramatta/i);
  });
});
