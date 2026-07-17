import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    disclosureManifest: { create: vi.fn() },
    consentDirective: { findFirst: vi.fn() },
    consentRecord: { findFirst: vi.fn() },
    consentUseEvent: { findFirst: vi.fn(), create: vi.fn() },
    consentReceipt: { findFirst: vi.fn(), create: vi.fn() },
  },
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(async () => ({ id: "ae-1" })),
}));

import { discloseParticipantData } from "@/lib/data-federation/disclosure-gateway";

describe("discloseParticipantData input guards", () => {
  it("denies when subjectId missing", async () => {
    const result = await discloseParticipantData({
      subjectId: "",
      purpose: "billing",
      recipientCategory: "plan_manager",
      purposeSummary: "test",
      requestedFields: ["displayName"],
      candidatePayload: {},
    });
    expect(result.decision).toBe("denied");
    expect(result.manifest).toBeNull();
    expect(result.outbound).toBeNull();
  });

  it("denies when purpose missing", async () => {
    const result = await discloseParticipantData({
      subjectId: "p1",
      purpose: undefined as never,
      recipientCategory: "plan_manager",
      purposeSummary: "test",
      requestedFields: ["displayName"],
      candidatePayload: {},
    });
    expect(result.decision).toBe("denied");
  });

  it("denies when recipientCategory missing", async () => {
    const result = await discloseParticipantData({
      subjectId: "p1",
      purpose: "billing",
      recipientCategory: undefined as never,
      purposeSummary: "test",
      requestedFields: ["displayName"],
      candidatePayload: {},
    });
    expect(result.decision).toBe("denied");
  });
});
