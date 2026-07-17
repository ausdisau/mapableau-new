import { describe, expect, it, vi, beforeEach } from "vitest";

import type { CurrentUser } from "@/lib/auth/current-user";
import { resolveParticipantAccess } from "@/lib/participant/participant-access";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    consentRecord: {
      findFirst: vi.fn(async () => null),
    },
    auditEvent: {
      create: vi.fn(async () => ({})),
    },
  },
}));

const participantUser: CurrentUser = {
  id: "user-participant",
  email: "p@example.com",
  name: "Pat",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  primaryRole: "participant",
  roles: ["participant"],
};

const nomineeUser: CurrentUser = {
  id: "user-nominee",
  email: "n@example.com",
  name: "Nominee",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  primaryRole: "family_member",
  roles: ["family_member"],
};

describe("resolveParticipantAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows participant to view own dashboard", async () => {
    const access = await resolveParticipantAccess(participantUser);
    expect(access).toEqual({
      participantId: "user-participant",
      viewAsDelegate: false,
    });
  });

  it("blocks nominee without consent", async () => {
    const access = await resolveParticipantAccess(
      nomineeUser,
      "user-participant",
    );
    expect(access).toBeNull();
  });

  it("blocks unrelated roles", async () => {
    const driver: CurrentUser = {
      ...participantUser,
      id: "driver-1",
      primaryRole: "driver",
      roles: ["driver"],
    };
    const access = await resolveParticipantAccess(driver);
    expect(access).toBeNull();
  });
});
