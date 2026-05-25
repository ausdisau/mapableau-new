import { describe, expect, it, vi, beforeEach } from "vitest";

import { PanelAccessError } from "@/lib/access-control/panel-access";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    organisation: {
      findUnique: vi.fn(),
    },
    workerProfile: {
      findUnique: vi.fn(),
    },
    driverProfile: {
      findUnique: vi.fn(),
    },
    vehicle: {
      findUnique: vi.fn(),
    },
    credentialDocument: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  assertProviderBookingEligible,
  assertWorkerMatchEligible,
} from "@/lib/access-control/safety-gates";

describe("safety gates (unit)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks booking when organisation not verified", async () => {
    vi.mocked(prisma.organisation.findUnique).mockResolvedValue({
      bookingEligible: false,
      verificationStatus: "pending_review",
      status: "active",
    } as never);

    await expect(assertProviderBookingEligible("org-1")).rejects.toMatchObject({
      code: "SAFETY_GATE",
    });
  });

  it("allows booking when organisation is eligible", async () => {
    vi.mocked(prisma.organisation.findUnique).mockResolvedValue({
      bookingEligible: true,
      verificationStatus: "verified",
      status: "active",
    } as never);

    await expect(assertProviderBookingEligible("org-1")).resolves.toBeUndefined();
  });

  it("blocks worker when screening not verified", async () => {
    vi.mocked(prisma.workerProfile.findUnique).mockResolvedValue({
      active: true,
      workerScreeningStatus: "pending_review",
      verificationStatus: "pending_review",
      screeningChecks: [],
    } as never);

    await expect(assertWorkerMatchEligible("worker-1")).rejects.toBeInstanceOf(
      PanelAccessError
    );
  });
});
