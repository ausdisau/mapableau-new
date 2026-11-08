import { beforeEach, describe, expect, it, vi } from "vitest";

const mockMapableIdConfig = vi.hoisted(() => ({
  dashboardEnabled: true,
  trustedIssuers: ["mapable:nextauth"] as const,
  audience: "mapable-id",
  adidFederationEnabled: false,
  googleIdentityMfaEnabled: false,
  webauthnEnrolmentMutationsEnabled: false,
}));

vi.mock("@/lib/config/mapable-id", () => ({
  mapableIdConfig: mockMapableIdConfig,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    passkeyCredential: { count: vi.fn() },
    mfaEnrolment: { findMany: vi.fn() },
    authSessionRecord: { findMany: vi.fn() },
    participantAuthorityGrant: { findMany: vi.fn() },
    consentRecord: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/api/auth-handler", () => ({
  requireApiSession: vi.fn(),
}));

vi.mock("@/lib/identity/adapters/mapable-nextauth-adapter", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("@/lib/identity/adapters/mapable-nextauth-adapter")
    >();
  return {
    ...actual,
    resolveNextAuthSubject: vi.fn(),
  };
});

import { GET } from "@/app/api/identity/me/route";
import { requireApiSession } from "@/lib/api/auth-handler";
import {
  assertAdidFederationAllowed,
  assertGoogleIdentityMfaAllowed,
  assertWebAuthnMutationsAllowed,
  listIdentityAdapters,
} from "@/lib/identity/adapters";
import { resolveNextAuthSubject } from "@/lib/identity/adapters/mapable-nextauth-adapter";
import {
  buildIdentityMeSnapshot,
  containsForbiddenIdentityFields,
} from "@/lib/identity/mapable-id-service";
import { identityMeResponseSchema } from "@/lib/identity/mapable-id-types";
import { prisma } from "@/lib/prisma";

describe("MapAbleID GET /api/identity/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMapableIdConfig.dashboardEnabled = true;
    vi.mocked(prisma.passkeyCredential.count).mockResolvedValue(1);
    vi.mocked(prisma.mfaEnrolment.findMany).mockResolvedValue([
      {
        id: "mfa-1",
        method: "passkey",
        status: "enrolled",
      },
    ] as never);
    vi.mocked(prisma.authSessionRecord.findMany).mockResolvedValue([
      {
        id: "sess-1",
        lastSeenAt: new Date("2026-11-08T01:00:00.000Z"),
        expiresAt: new Date("2026-11-09T01:00:00.000Z"),
        userAgent: "TestAgent",
      },
    ] as never);
    vi.mocked(prisma.participantAuthorityGrant.findMany).mockResolvedValue([
      {
        id: "grant-1",
        purpose: "Transport reminders",
        allowedActions: ["read_transport"],
        actions: [],
        status: "active",
        expiresAt: new Date("2026-12-01T00:00:00.000Z"),
        revokedAt: null,
        correlationId: "corr-1",
        recipientRole: "Support person",
        granteeUserId: "delegate-1",
        delegateId: null,
      },
    ] as never);
    vi.mocked(prisma.consentRecord.findMany).mockResolvedValue([
      {
        id: "consent-1",
        purpose: "Share transport preferences",
        scope: "transport_preferences",
        status: "active",
        expiryDate: null,
      },
    ] as never);
  });

  it("returns 404 when the dashboard flag is off", async () => {
    mockMapableIdConfig.dashboardEnabled = false;
    const response = await GET();
    expect(response.status).toBe(404);
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireApiSession).mockResolvedValue(
      new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    );
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("rejects cross-subject session mismatch", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({
      id: "user-1",
      name: "Alex",
      primaryRole: "participant",
    } as never);
    vi.mocked(resolveNextAuthSubject).mockResolvedValue({
      subjectId: "user-other",
      issuer: "mapable:nextauth",
      audience: "mapable-id",
      sessionId: "nextauth:user-other",
      expiresAtMs: Date.now() + 60_000,
    });
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("returns a scrubbed server-verified snapshot for the authenticated user", async () => {
    vi.mocked(requireApiSession).mockResolvedValue({
      id: "user-1",
      name: "Alex Example",
      primaryRole: "participant",
    } as never);
    vi.mocked(resolveNextAuthSubject).mockResolvedValue({
      subjectId: "user-1",
      issuer: "mapable:nextauth",
      audience: "mapable-id",
      sessionId: "nextauth:user-1",
      expiresAtMs: Date.now() + 60_000,
    });

    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    const parsed = identityMeResponseSchema.parse(body);
    expect(parsed.mode).toBe("server_verified_read_only");
    expect(parsed.subjectId).toBe("user-1");
    expect(parsed.policyShadow.allow).toBe(true);
    expect(parsed.services.find((s) => s.id === "mapable")?.status).toBe(
      "connected",
    );
    expect(containsForbiddenIdentityFields(parsed)).toEqual([]);
    expect(JSON.stringify(parsed)).not.toMatch(/passwordHash|sessionTokenHash|ndisNumber/i);
  });
});

describe("buildIdentityMeSnapshot scrubber", () => {
  it("never includes forbidden secret keys", async () => {
    const snapshot = await buildIdentityMeSnapshot({
      userId: "user-1",
      displayName: "Alex",
      primaryRole: "participant",
      sessionId: "nextauth:user-1",
      expiresAtMs: Date.now() + 60_000,
    });
    expect(containsForbiddenIdentityFields(snapshot)).toEqual([]);
    expect(snapshot).not.toHaveProperty("passwordHash");
    expect(snapshot.delegates[0]?.access).toContain("read_transport");
  });
});

describe("identity adapters", () => {
  it("lists NextAuth as active and federation adapters as disabled", () => {
    const adapters = listIdentityAdapters();
    expect(adapters.find((a) => a.id === "mapable-nextauth")?.status).toBe(
      "active",
    );
    expect(adapters.find((a) => a.id === "adid-oidc-federation")?.status).toBe(
      "disabled",
    );
    expect(adapters.find((a) => a.id === "google-identity-mfa")?.status).toBe(
      "disabled",
    );
    expect(adapters.find((a) => a.id === "webauthn-yubikey")?.status).toBe(
      "disabled",
    );
  });

  it("blocks disabled adapter mutation entry points", () => {
    expect(() => assertAdidFederationAllowed()).toThrow(/disabled/i);
    expect(() => assertGoogleIdentityMfaAllowed()).toThrow(/disabled/i);
    expect(() => assertWebAuthnMutationsAllowed()).toThrow(/disabled/i);
  });
});
