import { describe, expect, it } from "vitest";

import { interestFormSchema } from "@/lib/contact/interest-form-schema";

describe("interestFormSchema", () => {
  it("accepts a valid submission", () => {
    const parsed = interestFormSchema.safeParse({
      name: "Alex Taylor",
      email: "alex@example.com",
      role: "participant",
      interestedVerticals: ["planops", "home"],
      location: "Melbourne, VIC",
      message: "I would like to join the PlanOps pilot and learn more about MapAble Home.",
      consentContact: true,
      consentTesting: true,
      company: "",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects missing consent", () => {
    const parsed = interestFormSchema.safeParse({
      name: "Alex Taylor",
      email: "alex@example.com",
      role: "participant",
      interestedVerticals: ["planops"],
      location: "Sydney",
      message: "Interested in early access please.",
      consentContact: false,
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects empty vertical selection", () => {
    const parsed = interestFormSchema.safeParse({
      name: "Alex Taylor",
      email: "alex@example.com",
      role: "provider",
      interestedVerticals: [],
      location: "Brisbane",
      message: "We would like to partner on AccessOps.",
      consentContact: true,
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects filled honeypot fields", () => {
    const parsed = interestFormSchema.safeParse({
      name: "Alex Taylor",
      email: "alex@example.com",
      role: "participant",
      interestedVerticals: ["life"],
      location: "Perth",
      message: "This looks like a legitimate enquiry message here.",
      consentContact: true,
      company: "spam-co",
    });

    expect(parsed.success).toBe(false);
  });
});
