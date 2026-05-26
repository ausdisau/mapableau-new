import { beforeEach, describe, expect, it, vi } from "vitest";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({
    get: (name: string) =>
      ({
        "x-forwarded-for": "203.0.113.7, 10.0.0.1",
        "user-agent": "vitest",
      })[name],
  })),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    auditEvent: {
      create: vi.fn(),
    },
  },
}));

describe("createAuditEvent", () => {
  const tx = {
    auditEvent: {
      create: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("writes through the provided transaction client", async () => {
    await createAuditEvent(
      {
        actorUserId: "user_1",
        action: "access_place.created",
        entityType: "AccessPlace",
        entityId: "place_1",
        metadata: { secretToken: "abc123", status: "pending_moderation" },
      },
      tx as never,
    );

    expect(tx.auditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: "user_1",
        action: "access_place.created",
        entityType: "AccessPlace",
        entityId: "place_1",
        ipAddress: "203.0.113.7",
        userAgent: "vitest",
        metadata: {
          secretToken: "[REDACTED]",
          status: "pending_moderation",
        },
      }),
    });
    expect(prisma.auditEvent.create).not.toHaveBeenCalled();
  });
});
