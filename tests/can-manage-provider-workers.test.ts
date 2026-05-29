import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    organisation: { findMany: vi.fn() },
    organisationMember: { findMany: vi.fn() },
    providerUserRole: { findMany: vi.fn(), findUnique: vi.fn() },
    provider: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/api/phase3-scope", () => ({
  getUserOrganisationIds: vi.fn(),
}));

import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { prisma } from "@/lib/prisma";
import {
  canManageProviderById,
  canManageProviderWorkers,
  getManageableOrganisationIds,
} from "@/lib/providers/can-manage-provider-workers";

describe("canManageProviderWorkers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.organisationMember.findMany).mockResolvedValue([]);
    vi.mocked(prisma.providerUserRole.findMany).mockResolvedValue([]);
    vi.mocked(getUserOrganisationIds).mockResolvedValue([]);
  });

  it("allows mapable_admin for any organisation", async () => {
    const allowed = await canManageProviderWorkers(
      "user-1",
      "org-any",
      "mapable_admin"
    );
    expect(allowed).toBe(true);
    expect(prisma.organisationMember.findMany).not.toHaveBeenCalled();
  });

  it("allows ProviderUserRole ADMIN on matching organisation", async () => {
    vi.mocked(prisma.providerUserRole.findMany).mockResolvedValue([
      {
        provider: { organisationId: "org-1" },
      },
    ] as never);

    const allowed = await canManageProviderWorkers(
      "user-1",
      "org-1",
      "participant" as const
    );
    expect(allowed).toBe(true);
  });

  it("denies when user has no membership on organisation", async () => {
    const allowed = await canManageProviderWorkers(
      "user-1",
      "org-other",
      "participant" as const
    );
    expect(allowed).toBe(false);
  });
});

describe("canManageProviderById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows ADMIN provider role without org lookup", async () => {
    vi.mocked(prisma.providerUserRole.findUnique).mockResolvedValue({
      role: "ADMIN",
    } as never);

    const allowed = await canManageProviderById(
      "user-1",
      "00000000-0000-4000-8000-000000000001",
      "participant" as const
    );
    expect(allowed).toBe(true);
  });
});

describe("getManageableOrganisationIds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.organisationMember.findMany).mockResolvedValue([
      { organisationId: "org-a" },
    ] as never);
    vi.mocked(prisma.providerUserRole.findMany).mockResolvedValue([]);
    vi.mocked(getUserOrganisationIds).mockResolvedValue([]);
  });

  it("includes organisationMember provider_admin orgs", async () => {
    const ids = await getManageableOrganisationIds("user-1", "participant" as const);
    expect(ids).toContain("org-a");
  });
});
