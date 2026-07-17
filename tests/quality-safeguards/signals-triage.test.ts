import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@/lib/prisma";
import { triageSafeguardSignal } from "@/lib/quality-safeguards/signals-service";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    safeguardSignal: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    safeguardSignalLink: {
      upsert: vi.fn(),
    },
    qsImmutableAuditEvent: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/quality-safeguards/audit-service", () => ({
  appendQsImmutableAuditEvent: vi.fn().mockResolvedValue({
    id: "audit-1",
    eventHash: "abc",
    correlationId: "corr-1",
  }),
}));

const baseSignal = {
  id: "sig-1",
  organisationId: "org-1",
  sourceType: "incident" as const,
  sourceId: "inc-1",
  participantId: null,
  workerId: null,
  providerId: null,
  serviceVertical: "care" as const,
  summary: "Test",
  observedAt: new Date(),
  receivedAt: new Date(),
  urgency: "high" as const,
  immediateSafetyConcern: false,
  assignedTeam: null,
  assignedUserId: null,
  status: "new" as const,
  ruleTriggers: [],
  createdById: null,
  isAnonymous: false,
  dismissReason: null,
  triageNotes: null,
  convertedResourceType: null,
  convertedResourceId: null,
  deletedAt: null,
  version: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("signal triage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires reason for dismiss_with_reason", async () => {
    vi.mocked(prisma.safeguardSignal.findFirst).mockResolvedValue(baseSignal);
    await expect(
      triageSafeguardSignal({
        signalId: "sig-1",
        actorId: "actor-1",
        organisationId: "org-1",
        input: { action: "dismiss_with_reason" },
      })
    ).rejects.toThrow(/reason is required/i);
  });

  it("rejects cross-tenant access when organisation scoped", async () => {
    vi.mocked(prisma.safeguardSignal.findFirst).mockResolvedValue(null);
    await expect(
      triageSafeguardSignal({
        signalId: "sig-1",
        actorId: "actor-1",
        organisationId: "org-other",
        input: { action: "triage" },
      })
    ).rejects.toThrow(/not found/i);
  });

  it("updates status to triaged", async () => {
    vi.mocked(prisma.safeguardSignal.findFirst).mockResolvedValue(baseSignal);
    vi.mocked(prisma.safeguardSignal.update).mockResolvedValue({
      ...baseSignal,
      status: "triaged",
      version: 2,
    });

    const updated = await triageSafeguardSignal({
      signalId: "sig-1",
      actorId: "actor-1",
      organisationId: "org-1",
      input: { action: "triage", notes: "Reviewed" },
    });

    expect(updated.status).toBe("triaged");
    expect(prisma.safeguardSignal.update).toHaveBeenCalled();
  });

  it("links related signals", async () => {
    vi.mocked(prisma.safeguardSignal.findFirst).mockResolvedValue(baseSignal);
    vi.mocked(prisma.safeguardSignalLink.upsert).mockResolvedValue({} as never);
    vi.mocked(prisma.safeguardSignal.update).mockResolvedValue({
      ...baseSignal,
      status: "linked",
      version: 2,
    });

    await triageSafeguardSignal({
      signalId: "sig-1",
      actorId: "actor-1",
      organisationId: "org-1",
      input: { action: "link", linkedSignalId: "sig-2" },
    });

    expect(prisma.safeguardSignalLink.upsert).toHaveBeenCalled();
  });
});
