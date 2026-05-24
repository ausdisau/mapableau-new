import { describe, expect, it, vi } from "vitest";

import type { CurrentUser } from "@/lib/auth/current-user";
import {
  resolveCareAccess,
  resolveEmploymentAccess,
  resolveTransportAccess,
} from "@/lib/modules/access";

vi.mock("@/lib/api/phase3-scope", () => ({
  getUserOrganisationIds: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    consentRecord: { findFirst: vi.fn() },
    organisation: { findUnique: vi.fn() },
  },
}));

import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { prisma } from "@/lib/prisma";

const participant: CurrentUser = {
  id: "p1",
  email: "p@test.com",
  name: "Pat",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  primaryRole: "participant",
  roles: ["participant"],
};

describe("resolveCareAccess", () => {
  it("allows participant self", async () => {
    const access = await resolveCareAccess(participant);
    expect(access?.participantId).toBe("p1");
  });

  it("allows provider with org membership", async () => {
    vi.mocked(getUserOrganisationIds).mockResolvedValue(["org-1"]);
    const provider: CurrentUser = {
      ...participant,
      id: "prov1",
      primaryRole: "provider_admin",
      roles: ["provider_admin"],
    };
    const access = await resolveCareAccess(provider);
    expect(access?.organisationId).toBe("org-1");
  });
});

describe("resolveTransportAccess", () => {
  it("allows participant", async () => {
    const access = await resolveTransportAccess(participant);
    expect(access?.participantId).toBe("p1");
  });
});

describe("resolveEmploymentAccess", () => {
  it("denies delegate without consent", async () => {
    vi.mocked(prisma.consentRecord.findFirst).mockResolvedValue(null);
    const coord: CurrentUser = {
      ...participant,
      id: "c1",
      primaryRole: "support_coordinator",
      roles: ["support_coordinator"],
    };
    const access = await resolveEmploymentAccess(coord, { participantId: "p1" });
    expect(access).toBeNull();
  });
});
