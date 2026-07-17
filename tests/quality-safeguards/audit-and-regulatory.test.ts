import { beforeEach, describe, expect, it, vi } from "vitest";

import { hasPermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { appendQsImmutableAuditEvent } from "@/lib/quality-safeguards/audit-service";
import { getActiveRegulatoryProfile } from "@/lib/quality-safeguards/regulatory-config";
import { redactAnonymousSignal } from "@/lib/quality-safeguards/signals-service";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    qsImmutableAuditEvent: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe("immutable audit and regulatory config", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("appends audit events with hash chain fields", async () => {
    vi.mocked(prisma.qsImmutableAuditEvent.findFirst).mockResolvedValue({
      eventHash: "previous-hash",
    } as never);
    vi.mocked(prisma.qsImmutableAuditEvent.create).mockResolvedValue({
      id: "evt-1",
      eventHash: "new-hash",
      correlationId: "corr-1",
    } as never);

    const result = await appendQsImmutableAuditEvent({
      organisationId: "org-1",
      actorId: "user-1",
      action: "signal.triage",
      resourceType: "safeguard_signal",
      resourceId: "sig-1",
      before: { status: "new" },
      after: { status: "triaged" },
    });

    expect(result.id).toBe("evt-1");
    expect(prisma.qsImmutableAuditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          previousHash: "previous-hash",
          eventHash: expect.any(String),
          correlationId: expect.any(String),
        }),
      })
    );
  });

  it("exposes July 2026 reportability profile without claiming legal authority", () => {
    const profile = getActiveRegulatoryProfile();
    expect(profile.version).toBe("2026-07");
    expect(profile.disclaimer.toLowerCase()).toContain("not the ndis regulator");
    const urp = profile.categories.find(
      (c) => c.code === "unauthorised_restrictive_practice"
    );
    expect(urp?.initialDeadline).toEqual({ kind: "businessDays", value: 5 });
    expect(urp?.initialDeadlineIfHarm).toEqual({ kind: "hours", value: 24 });
  });

  it("redacts anonymous reporter identity without view_identity", () => {
    const redacted = redactAnonymousSignal(
      {
        id: "s1",
        organisationId: null,
        sourceType: "anonymous",
        sourceId: null,
        participantId: "p1",
        workerId: "w1",
        providerId: null,
        serviceVertical: "core",
        summary: "Contact me at person@example.com please",
        observedAt: new Date(),
        receivedAt: new Date(),
        urgency: "moderate",
        immediateSafetyConcern: false,
        assignedTeam: null,
        assignedUserId: null,
        status: "new",
        ruleTriggers: [],
        createdById: "u1",
        isAnonymous: true,
        dismissReason: null,
        triageNotes: null,
        convertedResourceType: null,
        convertedResourceId: null,
        deletedAt: null,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      false
    );
    expect(redacted.participantId).toBeNull();
    expect(redacted.summary).toContain("[redacted]");
  });

  it("grants qs permissions to mapable_admin via short-circuit", () => {
    expect(hasPermission("mapable_admin", "qs:ops:read")).toBe(true);
    expect(hasPermission("mapable_admin", "incident:confirm_reportability")).toBe(
      true
    );
  });

  it("grants provider_admin qs ops read", () => {
    expect(hasPermission("provider_admin", "qs:ops:read")).toBe(true);
    expect(hasPermission("provider_admin", "qs:signal:triage")).toBe(true);
  });
});
