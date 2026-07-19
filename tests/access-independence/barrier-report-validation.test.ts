import { describe, expect, it } from "vitest";

import { barrierReportSchema } from "@/lib/barrier-report/validation";

describe("barrier report validation", () => {
  it("accepts a report without an image", () => {
    const result = barrierReportSchema.safeParse({
      category: "entrance",
      description: "The temporary ramp was removed this morning.",
      urgency: "high",
      anonymous: true,
    });
    expect(result.success).toBe(true);
  });

  it("requires an image description when an image URL is provided", () => {
    const result = barrierReportSchema.safeParse({
      category: "lift",
      description: "Lift out of service on level 2.",
      imageUrl: "https://example.com/photo.jpg",
      anonymous: true,
    });
    expect(result.success).toBe(false);
  });

  it("requires consent before accepting contact details", () => {
    const result = barrierReportSchema.safeParse({
      category: "toilet",
      description: "Accessible toilet locked during open hours.",
      contactEmail: "person@example.com",
      anonymous: false,
      consentToContact: false,
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown fields", () => {
    const result = barrierReportSchema.safeParse({
      category: "other",
      description: "Staff blocked the accessible entrance.",
      diagnosis: "not-allowed",
    });
    expect(result.success).toBe(false);
  });
});
