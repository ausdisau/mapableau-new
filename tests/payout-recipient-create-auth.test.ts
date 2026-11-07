import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetServerSession = vi.fn();
const mockGetCurrentUser = vi.fn();
const createPayoutRecipient = vi.fn();
const organisationMemberFindFirst = vi.fn();
const workerProfileFindUnique = vi.fn();
const getUserOrganisationIds = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/app/api/auth/[...nextauth]/authOptions", () => ({
  authOptions: {},
}));

vi.mock("@/lib/auth/current-user", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/current-user")>(
    "@/lib/auth/current-user",
  );
  return {
    ...actual,
    getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
  };
});

vi.mock("@/lib/payouts/recipient-service", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/payouts/recipient-service")
  >("@/lib/payouts/recipient-service");
  return {
    ...actual,
    createPayoutRecipient: (...args: unknown[]) => createPayoutRecipient(...args),
  };
});

vi.mock("@/lib/api/organisation-scope", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/api/organisation-scope")
  >("@/lib/api/organisation-scope");
  return {
    ...actual,
    getUserOrganisationIds: (...args: unknown[]) => getUserOrganisationIds(...args),
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    organisationMember: {
      findFirst: (...args: unknown[]) => organisationMemberFindFirst(...args),
      findMany: vi.fn().mockResolvedValue([]),
    },
    workerProfile: {
      findUnique: (...args: unknown[]) => workerProfileFindUnique(...args),
    },
  },
}));

import { POST } from "@/app/api/payout-recipients/create/route";
import type { CurrentUser } from "@/lib/auth/current-user";

function userWithRole(
  role: CurrentUser["primaryRole"],
  id: string,
): CurrentUser {
  return {
    id,
    email: `${id}@test.com`,
    name: role,
    phone: null,
    timezone: "Australia/Sydney",
    locale: "en-AU",
    primaryRole: role,
    roles: [role],
  };
}

function createRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/payout-recipients/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/payout-recipients/create authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createPayoutRecipient.mockResolvedValue({ id: "recip-1" });
    organisationMemberFindFirst.mockResolvedValue(null);
    workerProfileFindUnique.mockResolvedValue(null);
    getUserOrganisationIds.mockResolvedValue([]);
  });

  it("allows a normal user to create their own recipient", async () => {
    const actor = userWithRole("participant", "user-a");
    mockGetServerSession.mockResolvedValue({ user: { id: actor.id } });
    mockGetCurrentUser.mockResolvedValue(actor);

    const res = await POST(
      createRequest({
        recipientType: "other",
        email: "a@test.com",
        displayName: "User A",
      }),
    );

    expect(res.status).toBe(200);
    expect(createPayoutRecipient).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-a" }),
      "user-a",
    );
  });

  it("forbids a normal user from creating a recipient for another userId", async () => {
    const actor = userWithRole("participant", "user-a");
    mockGetServerSession.mockResolvedValue({ user: { id: actor.id } });
    mockGetCurrentUser.mockResolvedValue(actor);

    const res = await POST(
      createRequest({
        recipientType: "other",
        userId: "user-b",
        email: "b@test.com",
        displayName: "User B",
      }),
    );

    expect(res.status).toBe(403);
    expect(createPayoutRecipient).not.toHaveBeenCalled();
  });

  it("allows a provider admin to create for their own organisation only", async () => {
    const actor = userWithRole("provider_admin", "prov-a");
    mockGetServerSession.mockResolvedValue({ user: { id: actor.id } });
    mockGetCurrentUser.mockResolvedValue(actor);
    organisationMemberFindFirst.mockResolvedValue({
      organisationId: "org-a",
      userId: "prov-a",
      role: "provider_admin",
    });

    const res = await POST(
      createRequest({
        recipientType: "provider_org",
        providerOrgId: "org-a",
        email: "org@test.com",
        displayName: "Org A",
      }),
    );

    expect(res.status).toBe(200);
    expect(createPayoutRecipient).toHaveBeenCalledWith(
      expect.objectContaining({ providerOrgId: "org-a" }),
      "prov-a",
    );
  });

  it("forbids an unrelated provider admin from creating for another organisation", async () => {
    const actor = userWithRole("provider_admin", "prov-b");
    mockGetServerSession.mockResolvedValue({ user: { id: actor.id } });
    mockGetCurrentUser.mockResolvedValue(actor);
    organisationMemberFindFirst.mockResolvedValue(null);

    const res = await POST(
      createRequest({
        recipientType: "provider_org",
        providerOrgId: "org-a",
        email: "org@test.com",
        displayName: "Org A",
      }),
    );

    expect(res.status).toBe(403);
    expect(createPayoutRecipient).not.toHaveBeenCalled();
  });

  it("allows mapable_admin to create for explicit targets", async () => {
    const actor = userWithRole("mapable_admin", "admin-1");
    mockGetServerSession.mockResolvedValue({ user: { id: actor.id } });
    mockGetCurrentUser.mockResolvedValue(actor);

    const res = await POST(
      createRequest({
        recipientType: "provider_org",
        userId: "user-x",
        providerOrgId: "org-x",
        email: "x@test.com",
        displayName: "Target X",
      }),
    );

    expect(res.status).toBe(200);
    expect(createPayoutRecipient).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-x",
        providerOrgId: "org-x",
      }),
      "admin-1",
    );
    expect(organisationMemberFindFirst).not.toHaveBeenCalled();
  });
});
