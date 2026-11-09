import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getApiUser: vi.fn(),
  findMany: vi.fn(),
  findUnique: vi.fn(),
  deleteMany: vi.fn(),
  updateMany: vi.fn(),
  auditCreate: vi.fn(),
}));

vi.mock("@/lib/auth/guards", () => ({
  getApiUser: mocks.getApiUser,
}));

vi.mock("@/lib/prisma", () => {
  const tx = {
    communitySignalObservation: {
      deleteMany: mocks.deleteMany,
      findUnique: mocks.findUnique,
      updateMany: mocks.updateMany,
    },
    communitySignalAudit: { create: mocks.auditCreate },
  };
  return {
    prisma: {
      communitySignalObservation: { findMany: mocks.findMany },
      $transaction: async (callback: (tx: typeof tx) => Promise<unknown>) => callback(tx),
    },
  };
});

import {
  DELETE,
  GET,
  POST,
} from "@/app/api/community/live/observations/route";
import { POST as review } from "@/app/api/community/live/moderation/route";

const originals = {
  live: process.env.MAPABLE_COMMUNITY_LIVE_ENABLED,
  pilot: process.env.MAPABLE_COMMUNITY_PILOT_MODE,
  invite: process.env.MAPABLE_COMMUNITY_PILOT_USER_IDS,
  vercel: process.env.VERCEL_ENV,
};

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

function browserRequest(path: string, method: string, body: unknown) {
  return new Request("https://mapable.com.au" + path, {
    method,
    headers: {
      Origin: "https://mapable.com.au",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("protected MapAble Community API: owner withdrawal and moderator concurrency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MAPABLE_COMMUNITY_LIVE_ENABLED = "true";
    process.env.MAPABLE_COMMUNITY_PILOT_MODE = "true";
    process.env.MAPABLE_COMMUNITY_PILOT_USER_IDS = "test-participant,test-reviewer";
    process.env.VERCEL_ENV = "preview";
    mocks.getApiUser.mockResolvedValue({
      id: "test-participant",
      primaryRole: "participant",
      roles: ["participant"],
    });
    mocks.auditCreate.mockResolvedValue({ id: "audit-1" });
  });

  afterEach(() => {
    restoreEnv("MAPABLE_COMMUNITY_LIVE_ENABLED", originals.live);
    restoreEnv("MAPABLE_COMMUNITY_PILOT_MODE", originals.pilot);
    restoreEnv("MAPABLE_COMMUNITY_PILOT_USER_IDS", originals.invite);
    restoreEnv("VERCEL_ENV", originals.vercel);
  });

  it("denies uninvited users even when they have a valid session", async () => {
    mocks.getApiUser.mockResolvedValue({ id: "outsider", primaryRole: "participant" });
    const response = await GET(new Request("https://mapable.com.au/api/community/live/observations?mine=1"));
    expect(response.status).toBe(403);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("denies anonymous access to public feeds in the closed pilot", async () => {
    mocks.getApiUser.mockResolvedValue(null);
    const response = await GET(new Request("https://mapable.com.au/api/community/live/observations"));
    expect(response.status).toBe(401);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("allows an invited account to remove only its own finding, recording minimal audit data", async () => {
    mocks.deleteMany.mockResolvedValue({ count: 1 });
    const response = await DELETE(browserRequest("/api/community/live/observations", "DELETE", { id: "finding1" }));
    expect(response.status).toBe(200);
    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: { id: "finding1", authorId: "test-participant" },
    });
    expect(mocks.auditCreate).toHaveBeenCalledWith({
      data: {
        action: "observation_removed",
        entityType: "observation",
        entityId: "finding1",
        actorId: "test-participant",
      },
    });
    expect(await response.json()).toMatchObject({ removed: true });
  });

  it("does not claim successful removal if the user does not own the record", async () => {
    mocks.deleteMany.mockResolvedValue({ count: 0 });
    const response = await DELETE(browserRequest("/api/community/live/observations", "DELETE", { id: "other-person-finding" }));
    expect(response.status).toBe(404);
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it("blocks reviewer approval after a competing withdrawal wins", async () => {
    // Race behaviour is shared with the future public release, not enabled in a pilot.
    process.env.MAPABLE_COMMUNITY_PILOT_MODE = "false";
    mocks.getApiUser.mockResolvedValue({
      id: "test-reviewer",
      primaryRole: "mapable_admin",
      roles: ["mapable_admin"],
    });
    mocks.findUnique.mockResolvedValue({
      id: "finding1",
      authorId: "test-participant",
      consentScope: "public",
      consentWithdrawnAt: null,
      moderation: "pending",
      challenge: { status: "published" },
    });
    mocks.updateMany.mockResolvedValue({ count: 0 });
    const response = await review(browserRequest("/api/community/live/moderation", "POST", {
      id: "finding1", decision: "approved", note: "",
    }));
    expect(response.status).toBe(409);
    expect(mocks.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: "finding1",
        consentWithdrawnAt: null,
        moderation: { in: ["pending", "needs_info"] },
      }),
    }));
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it("rejects even an invited reviewer approving their own contribution", async () => {
    mocks.getApiUser.mockResolvedValue({
      id: "test-reviewer",
      primaryRole: "mapable_admin",
      roles: ["mapable_admin"],
    });
    mocks.findUnique.mockResolvedValue({
      id: "finding1", authorId: "test-reviewer",
      consentScope: "public", consentWithdrawnAt: null,
      moderation: "pending", challenge: { status: "published" },
    });
    const response = await review(browserRequest("/api/community/live/moderation", "POST", {
      id: "finding1", decision: "approved", note: "",
    }));
    expect(response.status).toBe(403);
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("does not return any publicly published records in private pilot mode", async () => {
    const response = await GET(new Request("https://mapable.com.au/api/community/live/observations"));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ observations: [] });
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("refuses requests to publish a participant submission during the pilot", async () => {
    const response = await POST(browserRequest("/api/community/live/observations", "POST", {
      challengeId: "challenge1", title: "Observed step at entrance",
      feature: "Entrance", finding: "A step was present at the public entrance.",
      method: "direct observation", observedAt: "2026-11-09",
      consentScope: "public", consentAcknowledged: true,
    }));
    expect(response.status).toBe(409);
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it("refuses moderator publication approval during a protected pilot", async () => {
    mocks.getApiUser.mockResolvedValue({
      id: "test-reviewer",
      primaryRole: "mapable_admin",
      roles: ["mapable_admin"],
    });
    const response = await review(browserRequest("/api/community/live/moderation", "POST", {
      id: "finding1", decision: "approved", note: "",
    }));
    expect(response.status).toBe(409);
    expect(mocks.findUnique).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it("hard-disables live pilot endpoints if the deployment becomes production", async () => {
    process.env.VERCEL_ENV = "production";
    const response = await GET(new Request("https://mapable.com.au/api/community/live/observations"));
    expect(response.status).toBe(503);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });
});
