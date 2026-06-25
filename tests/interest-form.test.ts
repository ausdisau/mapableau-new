import { describe, expect, it } from "vitest";

import { interestFormSchema } from "@/lib/interest/interest-form-schema";

describe("interestFormSchema", () => {
  it("accepts a valid early access submission", () => {
    const parsed = interestFormSchema.safeParse({
      formType: "early_access",
      name: "Alex Taylor",
      email: "alex@example.com",
      roleOrOrganisation: "Participant",
      location: "Parramatta 2150",
      consent: true,
    });
    expect(parsed.success).toBe(true);
  });

  it("requires consent", () => {
    const parsed = interestFormSchema.safeParse({
      formType: "provider",
      name: "Alex Taylor",
      email: "alex@example.com",
      roleOrOrganisation: "Provider",
      location: "Sydney",
      consent: false,
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects honeypot", () => {
    const parsed = interestFormSchema.safeParse({
      formType: "employer",
      name: "Alex Taylor",
      email: "alex@example.com",
      roleOrOrganisation: "Employer",
      location: "Melbourne",
      consent: true,
      company: "spam",
    });
    expect(parsed.success).toBe(false);
  });
});
