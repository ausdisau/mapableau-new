import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    consentDirective: {
      findFirst: vi.fn(),
    },
    consentRecord: {
      findFirst: vi.fn(),
    },
    consentUseEvent: {
      findFirst: vi.fn(),
    },
  },
}));

import { evaluateConsentDirective } from "@/lib/consent-v2/evaluation";

describe("evaluateConsentDirective input guards", () => {
  it("fails closed when subjectId is missing", async () => {
    const result = await evaluateConsentDirective({
      subjectId: "",
      purpose: "billing",
      recipientCategory: "plan_manager",
    });
    expect(result.verdict).toBe("insufficient_input");
    expect(result.reason).toBe("subject_id_required");
  });

  it("fails closed when purpose is missing", async () => {
    const result = await evaluateConsentDirective({
      subjectId: "p1",
      recipientCategory: "plan_manager",
    });
    expect(result.verdict).toBe("insufficient_input");
    expect(result.reason).toBe("purpose_required");
  });

  it("fails closed when recipientCategory is missing", async () => {
    const result = await evaluateConsentDirective({
      subjectId: "p1",
      purpose: "billing",
    });
    expect(result.verdict).toBe("insufficient_input");
    expect(result.reason).toBe("recipient_category_required");
  });

  it("returns evaluatedAt as an ISO string", async () => {
    const result = await evaluateConsentDirective({
      subjectId: "p1",
    });
    expect(() => new Date(result.evaluatedAt).toISOString()).not.toThrow();
  });
});
