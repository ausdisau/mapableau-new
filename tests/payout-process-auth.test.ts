import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetServerSession = vi.fn();
const mockGetCurrentUser = vi.fn();
const createTransferForPayoutSplit = vi.fn();
const approvePayoutBatch = vi.fn();
const processPayoutBatch = vi.fn();
const createPayoutBatchFromReadySplits = vi.fn();
const listPayoutQueue = vi.fn();

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

vi.mock("@/lib/payouts/transfer-service", () => ({
  createTransferForPayoutSplit: (...args: unknown[]) =>
    createTransferForPayoutSplit(...args),
}));

vi.mock("@/lib/payouts/batch-service", () => ({
  approvePayoutBatch: (...args: unknown[]) => approvePayoutBatch(...args),
  processPayoutBatch: (...args: unknown[]) => processPayoutBatch(...args),
  createPayoutBatchFromReadySplits: (...args: unknown[]) =>
    createPayoutBatchFromReadySplits(...args),
  listPayoutQueue: (...args: unknown[]) => listPayoutQueue(...args),
}));

import { POST as processBatchPost } from "@/app/api/payouts/batches/[id]/process/route";
import { GET as payoutsGet } from "@/app/api/payouts/route";
import { POST as transferPost } from "@/app/api/payouts/splits/[id]/transfer/route";
import type { CurrentUser } from "@/lib/auth/current-user";

function userWithRole(
  role: CurrentUser["primaryRole"],
  id = "user-1",
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

describe("payout money-moving authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createTransferForPayoutSplit.mockResolvedValue({
      ok: true,
      transfer: { id: "tr_1" },
      duplicate: false,
    });
    approvePayoutBatch.mockResolvedValue({ id: "batch-1" });
    processPayoutBatch.mockResolvedValue({ processed: 1 });
    createPayoutBatchFromReadySplits.mockResolvedValue({ id: "batch-1" });
    listPayoutQueue.mockResolvedValue([]);
  });

  describe("POST /api/payouts/splits/[id]/transfer", () => {
    it("allows mapable_admin to create a Stripe transfer", async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: "admin-1" } });
      mockGetCurrentUser.mockResolvedValue(userWithRole("mapable_admin", "admin-1"));

      const res = await transferPost(new Request("http://localhost/api/x", { method: "POST" }), {
        params: Promise.resolve({ id: "split-1" }),
      });

      expect(res.status).toBe(200);
      expect(createTransferForPayoutSplit).toHaveBeenCalledWith("split-1");
    });

    it("forbids plan_manager from creating a Stripe transfer", async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: "pm-1" } });
      mockGetCurrentUser.mockResolvedValue(userWithRole("plan_manager", "pm-1"));

      const res = await transferPost(new Request("http://localhost/api/x", { method: "POST" }), {
        params: Promise.resolve({ id: "split-1" }),
      });

      expect(res.status).toBe(403);
      expect(createTransferForPayoutSplit).not.toHaveBeenCalled();
    });

    it("returns unauthorized for unauthenticated callers", async () => {
      mockGetServerSession.mockResolvedValue(null);
      mockGetCurrentUser.mockResolvedValue(null);

      const res = await transferPost(new Request("http://localhost/api/x", { method: "POST" }), {
        params: Promise.resolve({ id: "split-1" }),
      });

      expect(res.status).toBe(401);
      expect(createTransferForPayoutSplit).not.toHaveBeenCalled();
    });
  });

  describe("POST /api/payouts/batches/[id]/process", () => {
    it("forbids plan_manager from approving a payout batch", async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: "pm-1" } });
      mockGetCurrentUser.mockResolvedValue(userWithRole("plan_manager", "pm-1"));

      const res = await processBatchPost(
        new Request("http://localhost/api/x", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "approve", splitIds: ["s1"] }),
        }),
        { params: Promise.resolve({ id: "batch-1" }) },
      );

      expect(res.status).toBe(403);
      expect(approvePayoutBatch).not.toHaveBeenCalled();
    });

    it("allows mapable_admin to approve a payout batch", async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: "admin-1" } });
      mockGetCurrentUser.mockResolvedValue(userWithRole("mapable_admin", "admin-1"));

      const res = await processBatchPost(
        new Request("http://localhost/api/x", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "approve", splitIds: ["s1"] }),
        }),
        { params: Promise.resolve({ id: "batch-1" }) },
      );

      expect(res.status).toBe(200);
      expect(approvePayoutBatch).toHaveBeenCalledWith("batch-1", "admin-1");
    });
  });

  describe("GET /api/payouts?scope=admin", () => {
    it("forbids plan_manager from listing the admin payout queue", async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: "pm-1" } });
      mockGetCurrentUser.mockResolvedValue(userWithRole("plan_manager", "pm-1"));

      const res = await payoutsGet(
        new Request("http://localhost/api/payouts?scope=admin"),
      );

      expect(res.status).toBe(403);
      expect(listPayoutQueue).not.toHaveBeenCalled();
    });
  });
});
