import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

import { commitImportJob } from "@/lib/access-import/access-import-commit-service";
import { createAccessPlace } from "@/lib/access-map/access-place-service";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/access-map/access-place-service", () => ({
  createAccessPlace: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
  },
}));

describe("commitImportJob", () => {
  const tx = {
    accessImportJob: {
      updateMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    accessImportItem: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    accessPlaceSource: {
      create: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    tx.accessImportJob.updateMany.mockResolvedValue({ count: 1 });
    tx.accessImportItem.findMany.mockResolvedValue([
      {
        id: "item_1",
        name: "Accessible Cafe",
        category: null,
        description: "Step-free entry",
        latitude: -33.87,
        longitude: 151.2,
        externalRef: "external_1",
      },
    ]);
    vi.mocked(createAccessPlace).mockResolvedValue({ id: "place_1" } as never);
    (prisma.$transaction as unknown as Mock).mockImplementation(
      async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx),
    );
  });

  it("creates imported places with the import transaction client", async () => {
    await commitImportJob("job_1", "user_1");

    expect(createAccessPlace).toHaveBeenCalledWith(
      expect.objectContaining({
        createdById: "user_1",
        sourceType: "imported",
        sourceReference: "external_1",
        db: tx,
      }),
    );
    expect(tx.accessPlaceSource.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ placeId: "place_1" }),
      }),
    );
  });
});
