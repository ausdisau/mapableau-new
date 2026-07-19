import { beforeEach, describe, expect, it, vi } from "vitest";

const requireApiPermission = vi.fn();
const requireApiAdmin = vi.fn();
const getUserOrganisationIds = vi.fn();
const findMany = vi.fn();
const findFirst = vi.fn();
const findUnique = vi.fn();
const update = vi.fn();
const createAuditEvent = vi.fn();

vi.mock("@/lib/api/auth-handler", () => ({
  requireApiPermission: (...args: unknown[]) => requireApiPermission(...args),
  requireApiAdmin: (...args: unknown[]) => requireApiAdmin(...args),
}));

vi.mock("@/lib/api/phase3-scope", () => ({
  getUserOrganisationIds: (...args: unknown[]) =>
    getUserOrganisationIds(...args),
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: (...args: unknown[]) => createAuditEvent(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    accessBarrierReport: {
      findMany: (...args: unknown[]) => findMany(...args),
      findFirst: (...args: unknown[]) => findFirst(...args),
      findUnique: (...args: unknown[]) => findUnique(...args),
      update: (...args: unknown[]) => update(...args),
    },
    organisation: {
      findFirst: vi.fn().mockResolvedValue({ id: "org-a" }),
    },
  },
}));

import { GET as adminGet } from "@/app/api/admin/access-barrier-reports/route";
import { GET as providerList } from "@/app/api/provider/access-barrier-reports/route";
import { PATCH as providerPatch } from "@/app/api/provider/access-barrier-reports/[id]/route";
import { PROVIDER_BARRIER_SELECT } from "@/lib/barrier-report/tenancy";

const providerUser = {
  id: "provider-a",
  primaryRole: "provider_admin",
  email: "a@test.com",
  name: "A",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  roles: ["provider_admin"],
};

describe("provider barrier tenancy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ACCESS_INDEPENDENCE_PROVIDER_BARRIER_INBOX = "true";
  });

  it("never selects reporter contact fields for provider responses", () => {
    expect(PROVIDER_BARRIER_SELECT).not.toHaveProperty("contactEmail");
    expect(PROVIDER_BARRIER_SELECT).not.toHaveProperty("contactPhone");
    expect(PROVIDER_BARRIER_SELECT).not.toHaveProperty("triageNotes");
  });

  it("scopes provider list to the caller's organisation ids", async () => {
    requireApiPermission.mockResolvedValue(providerUser);
    getUserOrganisationIds.mockResolvedValue(["org-a"]);
    findMany.mockResolvedValue([
      {
        id: "r1",
        organisationId: "org-a",
        referenceNumber: "ABR-1",
        category: "entrance",
        description: "Ramp missing",
        placeName: "Cafe",
        placeSlug: "cafe",
        locationDetail: null,
        urgency: "high",
        status: "received",
        observedAt: null,
        imageDescription: null,
        anonymous: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const res = await providerList();
    expect(res.status).toBe(200);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organisationId: { in: ["org-a"] },
        }),
      }),
    );
    const body = (await res.json()) as {
      reports: Array<{ contactEmail?: string }>;
    };
    expect(body.reports[0]).not.toHaveProperty("contactEmail");
  });

  it("returns 404 when provider A updates a report outside tenant scope", async () => {
    requireApiPermission.mockResolvedValue(providerUser);
    getUserOrganisationIds.mockResolvedValue(["org-a"]);
    findFirst.mockResolvedValue(null);

    const res = await providerPatch(
      new Request("http://localhost/api/provider/access-barrier-reports/r-b", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "reviewing" }),
      }),
      { params: Promise.resolve({ id: "r-b" }) },
    );
    expect(res.status).toBe(404);
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects users lacking organisation permission", async () => {
    requireApiPermission.mockResolvedValue(
      new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 }),
    );
    const res = await providerList();
    expect(res.status).toBe(403);
  });

  it("keeps platform moderation on a separate admin authorisation path", async () => {
    requireApiAdmin.mockResolvedValue({
      ...providerUser,
      id: "admin-1",
      primaryRole: "mapable_admin",
    });
    findMany.mockResolvedValue([]);
    const res = await adminGet();
    expect(res.status).toBe(200);
    expect(requireApiAdmin).toHaveBeenCalled();
  });
});
