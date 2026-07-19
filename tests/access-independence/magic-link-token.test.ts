import { beforeEach, describe, expect, it, vi } from "vitest";

const updateMany = vi.fn();
const create = vi.fn();
const findUnique = vi.fn();
const deleteMany = vi.fn();
const transaction = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: (...args: unknown[]) => transaction(...args),
    magicLinkToken: {
      updateMany: (...args: unknown[]) => updateMany(...args),
      create: (...args: unknown[]) => create(...args),
      findUnique: (...args: unknown[]) => findUnique(...args),
      deleteMany: (...args: unknown[]) => deleteMany(...args),
    },
  },
}));

import {
  cleanupExpiredMagicLinkTokens,
  consumeMagicLinkToken,
  hashMagicLinkToken,
  issueMagicLinkToken,
} from "@/lib/auth/magic-link-token";
import { safeAuthCallbackPath } from "@/lib/auth/auth-flow";

describe("magic link tokens", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn({
        magicLinkToken: {
          updateMany,
          create,
          findUnique,
        },
      }),
    );
  });

  it("stores only a hash of the token", async () => {
    create.mockResolvedValue({});
    updateMany.mockResolvedValue({ count: 0 });
    const issued = await issueMagicLinkToken({ userId: "user-1" });
    expect(issued.rawToken.length).toBeGreaterThan(20);
    expect(issued.tokenHash).toBe(hashMagicLinkToken(issued.rawToken));
    expect(issued.tokenHash).not.toBe(issued.rawToken);
    const createArg = create.mock.calls[0]?.[0] as {
      data: { tokenHash: string };
    };
    expect(createArg.data.tokenHash).toBe(issued.tokenHash);
    expect(JSON.stringify(createArg)).not.toContain(issued.rawToken);
  });

  it("consumes a valid token once and rejects replay", async () => {
    const raw = "a".repeat(32);
    const tokenHash = hashMagicLinkToken(raw);
    findUnique.mockResolvedValue({
      id: "tok-1",
      userId: "user-1",
      purpose: "credentials-magic-link",
      expiresAt: new Date(Date.now() + 60_000),
      consumedAt: null,
      revokedAt: null,
    });
    updateMany.mockResolvedValueOnce({ count: 1 });
    const first = await consumeMagicLinkToken(raw);
    expect(first?.userId).toBe("user-1");

    findUnique.mockResolvedValue({
      id: "tok-1",
      userId: "user-1",
      purpose: "credentials-magic-link",
      expiresAt: new Date(Date.now() + 60_000),
      consumedAt: new Date(),
      revokedAt: null,
    });
    const second = await consumeMagicLinkToken(raw);
    expect(second).toBeNull();
    expect(tokenHash).toHaveLength(64);
  });

  it("rejects expired and revoked tokens", async () => {
    findUnique.mockResolvedValue({
      id: "tok-2",
      userId: "user-1",
      purpose: "credentials-magic-link",
      expiresAt: new Date(Date.now() - 1000),
      consumedAt: null,
      revokedAt: null,
    });
    expect(await consumeMagicLinkToken("b".repeat(32))).toBeNull();

    findUnique.mockResolvedValue({
      id: "tok-3",
      userId: "user-1",
      purpose: "credentials-magic-link",
      expiresAt: new Date(Date.now() + 60_000),
      consumedAt: null,
      revokedAt: new Date(),
    });
    expect(await consumeMagicLinkToken("c".repeat(32))).toBeNull();
  });

  it("rejects external callback URLs", () => {
    expect(safeAuthCallbackPath("https://evil.example/phish")).toBe(
      "/dashboard",
    );
    expect(safeAuthCallbackPath("//evil.example")).toBe("/dashboard");
    expect(safeAuthCallbackPath("/dashboard/access-passport")).toBe(
      "/dashboard/access-passport",
    );
  });

  it("supports cleanup of expired records", async () => {
    deleteMany.mockResolvedValue({ count: 3 });
    await expect(cleanupExpiredMagicLinkTokens(7)).resolves.toBe(3);
    expect(deleteMany).toHaveBeenCalled();
  });
});
