import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  LAUNCH_READINESS_STATUSES,
  updateLaunchReadinessItem,
} from "@/lib/launch-readiness/launch-readiness-service";
import {
  isLaunchAutoCheckSupported,
  listLaunchAutoCheckCodes,
} from "@/lib/launch-readiness/launch-auto-checks";
import { PUBLIC_LAUNCH_CHECKLIST } from "@/lib/launch-readiness/public-launch-checklist";

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    launchReadinessItem: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const { prisma } = await import("@/lib/prisma");
const { createAuditEvent } = await import("@/lib/audit/audit-event-service");

describe("launch readiness service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exposes all lifecycle statuses", () => {
    expect(LAUNCH_READINESS_STATUSES).toEqual([
      "not_started",
      "in_progress",
      "blocked",
      "ready",
      "waived",
    ]);
  });

  it("updates item with audit", async () => {
    vi.mocked(prisma.launchReadinessItem.findUnique).mockResolvedValue({
      id: "item-1",
      code: "PRIVACY_POLICY_LIVE",
      status: "not_started",
    } as never);
    vi.mocked(prisma.launchReadinessItem.update).mockResolvedValue({
      id: "item-1",
      code: "PRIVACY_POLICY_LIVE",
      status: "ready",
    } as never);

    const item = await updateLaunchReadinessItem({
      code: "PRIVACY_POLICY_LIVE",
      status: "ready",
      actorUserId: "admin-1",
      notes: "Published at /privacy",
    });

    expect(item.status).toBe("ready");
    expect(createAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "launch_readiness.item_updated",
      })
    );
  });
});

describe("launch checklist runbooks", () => {
  it("assigns runbook path per code", () => {
    for (const item of PUBLIC_LAUNCH_CHECKLIST) {
      expect(item.runbookPath).toBe(`/docs/runbooks/launch/${item.code}`);
    }
  });
});

describe("launch auto-check registry", () => {
  it("lists supported automation codes", () => {
    const codes = listLaunchAutoCheckCodes();
    expect(codes.length).toBeGreaterThanOrEqual(5);
    expect(isLaunchAutoCheckSupported("STRIPE_PRODUCTION_VERIFIED")).toBe(true);
    expect(isLaunchAutoCheckSupported("DISPATCH_RUNBOOK")).toBe(false);
  });
});
