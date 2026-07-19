import { beforeEach, describe, expect, it, vi } from "vitest";

const requireApiSession = vi.fn();
const createAuditEvent = vi.fn();
const findUnique = vi.fn();
const update = vi.fn();
const create = vi.fn();

vi.mock("@/lib/api/auth-handler", () => ({
  requireApiSession: (...args: unknown[]) => requireApiSession(...args),
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: (...args: unknown[]) => createAuditEvent(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    accessibilityProfile: {
      findUnique: (...args: unknown[]) => findUnique(...args),
      update: (...args: unknown[]) => update(...args),
      create: (...args: unknown[]) => create(...args),
    },
  },
}));

import { PATCH } from "@/app/api/accessibility-profile/route";

describe("PATCH /api/accessibility-profile merge safety", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiSession.mockResolvedValue({
      id: "user-1",
      primaryRole: "participant",
    });
  });

  it("merges nested JSON and does not overwrite share settings", async () => {
    findUnique.mockResolvedValue({
      id: "profile-1",
      userId: "user-1",
      mobilityNeeds: ["walker"],
      communicationPreferences: ["email"],
      sensoryPreferences: { lightSensitivity: true, quietSpace: true },
      cognitivePreferences: { plainLanguage: true },
      transportRequirements: { requiresRamp: true },
      digitalPreferences: { screenReaderUser: true },
      shareWithProviders: {
        version: 1,
        categories: ["mobility"],
        recipientLabel: "Clinic",
        purpose: "Visit planning",
        expiresAt: null,
        active: true,
      },
    });

    update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: "profile-1",
      ...data,
    }));

    const res = await PATCH(
      new Request("http://localhost/api/accessibility-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobilityNeeds: ["walker"],
          communicationPreferences: ["email"],
          sensoryPreferences: { lightSensitivity: false },
          cognitivePreferences: {},
          transportRequirements: {},
          digitalPreferences: { largeText: true },
          shareWithProviders: {},
        }),
      }),
    );

    expect(res.status).toBe(200);
    const updateArg = update.mock.calls[0]?.[0] as {
      data: Record<string, unknown>;
    };
    expect(updateArg.data.sensoryPreferences).toEqual({
      lightSensitivity: false,
      quietSpace: true,
    });
    expect(updateArg.data.cognitivePreferences).toEqual({
      plainLanguage: true,
    });
    expect(updateArg.data.digitalPreferences).toEqual({
      screenReaderUser: true,
      largeText: true,
    });
    expect(updateArg.data).not.toHaveProperty("shareWithProviders");
  });
});
