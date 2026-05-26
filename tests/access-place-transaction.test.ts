import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { createAccessPlace } from "@/lib/access-map/access-place-service";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    accessPlace: {
      create: vi.fn(),
    },
  },
}));

describe("createAccessPlace", () => {
  const mockedPrisma = prisma as unknown as {
    accessPlace: { create: Mock };
  };
  const place = { id: "place_1", location: null, features: [] };
  const tx = {
    accessPlace: {
      create: vi.fn(),
    },
    auditEvent: {
      create: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    tx.accessPlace.create.mockResolvedValue(place);
  });

  it("uses the provided transaction client for place and audit writes", async () => {
    await createAccessPlace({
      input: {
        name: "Accessible Cafe",
        category: "other",
        latitude: -33.87,
        longitude: 151.2,
        country: "AU",
      },
      createdById: "user_1",
      status: "pending_moderation",
      sourceType: "imported",
      sourceReference: "external_1",
      db: tx as never,
    });

    expect(tx.accessPlace.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Accessible Cafe",
          sourceType: "imported",
          sourceReference: "external_1",
        }),
      }),
    );
    expect(mockedPrisma.accessPlace.create).not.toHaveBeenCalled();
    expect(createAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "access_place.created",
        entityType: "AccessPlace",
        entityId: "place_1",
      }),
      tx,
    );
  });
});
