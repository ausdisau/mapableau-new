import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    lifeIntent: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/config/personal-agency", () => ({
  personalAgencyFlags: { lifeIntentsEnabled: true },
}));

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  createLifeIntent,
  getLifeIntentForPrincipal,
  LifeIntentError,
} from "@/lib/personal-agency/life-intent-service";
import { prisma } from "@/lib/prisma";

describe("life-intent-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("preserves originalExpression verbatim", async () => {
    const words = 'I want to start swimming.';
    vi.mocked(prisma.lifeIntent.create).mockResolvedValue({
      id: "li_1",
      principalId: "user_1",
      originalExpression: words,
      status: "EXPLORING",
      desiredOutcomes: [],
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const intent = await createLifeIntent({
      principalId: "user_1",
      originalExpression: words,
    });

    expect(intent.originalExpression).toBe(words);
    expect(createAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "PAI_LIFE_INTENT_CREATED" }),
    );
  });

  it("rejects empty expression", async () => {
    await expect(
      createLifeIntent({ principalId: "user_1", originalExpression: "   " }),
    ).rejects.toBeInstanceOf(LifeIntentError);
  });

  it("scopes get by principal", async () => {
    vi.mocked(prisma.lifeIntent.findFirst).mockResolvedValue(null);
    await expect(getLifeIntentForPrincipal("li_1", "user_2")).rejects.toMatchObject({
      status: 404,
    });
    expect(prisma.lifeIntent.findFirst).toHaveBeenCalledWith({
      where: { id: "li_1", principalId: "user_2" },
    });
  });
});
