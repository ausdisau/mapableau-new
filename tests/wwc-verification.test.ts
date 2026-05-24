import { describe, expect, it, vi } from "vitest";

import {
  canWorkerPerformChildRelatedSupport,
  publicBadgeLabelForStatus,
} from "@/lib/verification/wwc/wwc-eligibility-service";
import {
  describeWwcRequirementReasons,
  isParticipantUnder18,
  requiresWwcForBooking,
} from "@/lib/verification/wwc/wwc-requirement-rules";
import { manualWwcAdapter } from "@/lib/verification/wwc/manual-wwc-adapter";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    wwcVerification: {
      findFirst: vi.fn(),
    },
    workerProfile: {
      update: vi.fn(),
    },
  },
}));

describe("wwc requirement rules", () => {
  it("requires WWC for participant under 18", () => {
    expect(
      requiresWwcForBooking({ participantUnder18: true })
    ).toBe(true);
    expect(describeWwcRequirementReasons({ participantUnder18: true })).toContain(
      "Participant is under 18"
    );
  });

  it("requires WWC for MapAble Kids booking", () => {
    expect(requiresWwcForBooking({ mapableKids: true })).toBe(true);
  });

  it("requires WWC for school transport", () => {
    expect(requiresWwcForBooking({ schoolTransport: true })).toBe(true);
  });

  it("requires WWC for paediatric therapy", () => {
    expect(requiresWwcForBooking({ paediatricTherapy: true })).toBe(true);
  });

  it("does not require WWC for general adult support", () => {
    expect(requiresWwcForBooking({})).toBe(false);
  });

  it("calculates under 18 from date of birth", () => {
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 10);
    expect(isParticipantUnder18(dob)).toBe(true);
  });
});

describe("public badge labels", () => {
  it("does not show verified publicly while pending review", () => {
    expect(publicBadgeLabelForStatus("pending_review")).toBe("Check in progress");
    expect(publicBadgeLabelForStatus("approved")).toBe(
      "Child-related checks complete"
    );
  });
});

describe("manual wwc adapter", () => {
  it("supports NSW working with children check", () => {
    expect(
      manualWwcAdapter.supports("NSW", "working_with_children_check")
    ).toBe(true);
  });

  it("returns pending manual review without criminal history payload", async () => {
    const result = await manualWwcAdapter.check({
      jurisdiction: "NSW",
      checkType: "working_with_children_check",
      checkNumber: "WWC1234567",
      legalFirstName: "Alex",
      legalLastName: "Taylor",
      consentConfirmed: true,
      workerProfileId: "w1",
      organisationId: "o1",
    });
    expect(result.success).toBe(true);
    expect(result.verifiedResult).toBe("pending_manual_review");
    expect(JSON.stringify(result.payload)).not.toMatch(/criminal|offence/i);
  });
});

describe("eligibility with mocked prisma", () => {
  it("blocks rejected WWC status", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.wwcVerification.findFirst).mockResolvedValue({
      id: "v1",
      status: "rejected",
      expiresAt: null,
    } as never);

    const result = await canWorkerPerformChildRelatedSupport("worker-1", {
      paediatricTherapy: true,
    });

    expect(result.allowed).toBe(false);
  });

  it("blocks when no verification on file", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.wwcVerification.findFirst).mockResolvedValue(null);

    const result = await canWorkerPerformChildRelatedSupport("worker-1", {
      participantUnder18: true,
    });

    expect(result.required).toBe(true);
    expect(result.allowed).toBe(false);
    expect(result.missingRequirements.length).toBeGreaterThan(0);
  });

  it("allows when approved and not expired", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.wwcVerification.findFirst).mockResolvedValue({
      id: "v1",
      status: "approved",
      expiresAt: new Date(Date.now() + 86400000 * 365),
    } as never);

    const result = await canWorkerPerformChildRelatedSupport("worker-1", {
      mapableKids: true,
    });

    expect(result.allowed).toBe(true);
  });

  it("blocks expired WWC for child support", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.wwcVerification.findFirst).mockResolvedValue({
      id: "v1",
      status: "expired",
      expiresAt: new Date(Date.now() - 1000),
    } as never);

    const result = await canWorkerPerformChildRelatedSupport("worker-1", {
      schoolTransport: true,
    });

    expect(result.allowed).toBe(false);
  });
});
