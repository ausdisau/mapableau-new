import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetServerSession = vi.fn();
const mockGetCurrentUser = vi.fn();
const findUniquePayment = vi.fn();
const findUniqueInvoice = vi.fn();
const getUserOrganisationIds = vi.fn();
const exportPaymentToCsv = vi.fn();

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

vi.mock("@/lib/api/organisation-scope", () => ({
  getUserOrganisationIds: (...args: unknown[]) => getUserOrganisationIds(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    billingPayment: {
      findUnique: (...args: unknown[]) => findUniquePayment(...args),
    },
    billingInvoice: {
      findUnique: (...args: unknown[]) => findUniqueInvoice(...args),
    },
  },
}));

vi.mock("@/lib/payouts/export-service", () => ({
  exportPaymentToCsv: (...args: unknown[]) => exportPaymentToCsv(...args),
}));

import { GET } from "@/app/api/payouts/export/[paymentId]/route";
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

describe("GET /api/payouts/export/[paymentId] authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    exportPaymentToCsv.mockResolvedValue({ ok: true, csv: "a,b\n1,2\n" });
    findUniquePayment.mockResolvedValue({
      id: "pay-1",
      userId: "user-a",
      providerId: "org-a",
      invoiceId: "inv-1",
    });
    findUniqueInvoice.mockResolvedValue({
      id: "inv-1",
      userId: "user-a",
      providerId: "org-a",
    });
  });

  it("allows the payment owner to export", async () => {
    const actor = userWithRole("participant", "user-a");
    mockGetServerSession.mockResolvedValue({ user: { id: actor.id } });
    mockGetCurrentUser.mockResolvedValue(actor);

    const res = await GET(new Request("http://localhost/api/x"), {
      params: Promise.resolve({ paymentId: "pay-1" }),
    });

    expect(res.status).toBe(200);
    expect(exportPaymentToCsv).toHaveBeenCalledWith("pay-1");
  });

  it("denies an unrelated signed-in user", async () => {
    const actor = userWithRole("participant", "user-b");
    mockGetServerSession.mockResolvedValue({ user: { id: actor.id } });
    mockGetCurrentUser.mockResolvedValue(actor);
    getUserOrganisationIds.mockResolvedValue([]);

    const res = await GET(new Request("http://localhost/api/x"), {
      params: Promise.resolve({ paymentId: "pay-1" }),
    });

    expect(res.status).toBe(404);
    expect(exportPaymentToCsv).not.toHaveBeenCalled();
  });

  it("allows a provider admin for the matching provider/org", async () => {
    const actor = userWithRole("provider_admin", "prov-a");
    mockGetServerSession.mockResolvedValue({ user: { id: actor.id } });
    mockGetCurrentUser.mockResolvedValue(actor);
    getUserOrganisationIds.mockResolvedValue(["org-a"]);

    const res = await GET(new Request("http://localhost/api/x"), {
      params: Promise.resolve({ paymentId: "pay-1" }),
    });

    expect(res.status).toBe(200);
    expect(exportPaymentToCsv).toHaveBeenCalledWith("pay-1");
  });

  it("denies an unrelated provider admin", async () => {
    const actor = userWithRole("provider_admin", "prov-b");
    mockGetServerSession.mockResolvedValue({ user: { id: actor.id } });
    mockGetCurrentUser.mockResolvedValue(actor);
    getUserOrganisationIds.mockResolvedValue(["org-b"]);

    const res = await GET(new Request("http://localhost/api/x"), {
      params: Promise.resolve({ paymentId: "pay-1" }),
    });

    expect(res.status).toBe(404);
    expect(exportPaymentToCsv).not.toHaveBeenCalled();
  });

  it("allows mapable_admin to export", async () => {
    const actor = userWithRole("mapable_admin", "admin-1");
    mockGetServerSession.mockResolvedValue({ user: { id: actor.id } });
    mockGetCurrentUser.mockResolvedValue(actor);

    const res = await GET(new Request("http://localhost/api/x"), {
      params: Promise.resolve({ paymentId: "pay-1" }),
    });

    expect(res.status).toBe(200);
    expect(exportPaymentToCsv).toHaveBeenCalledWith("pay-1");
  });
});
