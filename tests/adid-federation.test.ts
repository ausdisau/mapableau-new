import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  adidConnectionClaim,
  adidIdentity,
  getAdidConfig,
} from "@/lib/auth/adid-config";
import { resolveAdidUser } from "@/lib/auth/adid-user";
import { buildOAuthProviders } from "@/lib/auth/oauth-providers";

const mock = vi.hoisted(() => ({
  link: vi.fn(),
  read: vi.fn(),
  existing: vi.fn(),
  create: vi.fn(),
  bind: vi.fn(),
  audit: vi.fn(),
  transaction: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    identityProviderLink: { findUnique: mock.link },
    user: { findUnique: mock.read },
    $transaction: mock.transaction,
  },
}));
vi.mock("@/lib/auth/ensure-oauth-user", () => ({
  oauthOnlyPasswordHash: async () => "synthetic-hash",
}));
const cfg = {
  ADID_AUTH0_ENABLED: "true",
  ADID_PORTAL_ORIGIN: "https://id.example",
  ADID_AUTH0_ISSUER: "https://broker.example",
  ADID_AUTH0_CONNECTION: "clerk-review",
  ADID_AUTH0_CLIENT_ID: "mapable",
  ADID_AUTH0_CLIENT_SECRET: "synthetic",
};
const config = getAdidConfig(cfg)!;
const claims = {
  sub: "upstream-sub",
  iss: "https://broker.example/",
  [adidConnectionClaim]: "clerk-review",
  email_verified: true,
  email: "test@example.test",
  name: "Test Reader",
  role: "admin",
};
const identity = adidIdentity(claims, claims.sub, config)!;
const local = {
  id: "local-user",
  primaryRole: "participant",
  name: "Local Reader",
  email: claims.email,
};
beforeEach(() => {
  vi.resetAllMocks();
  mock.transaction.mockImplementation((fn) =>
    fn({
      user: { findFirst: mock.existing, create: mock.create },
      identityProviderLink: { create: mock.bind },
      authBridgeEvent: { create: mock.audit },
    }),
  );
  mock.link.mockResolvedValue(null);
  mock.existing.mockResolvedValue(null);
  mock.create.mockResolvedValue(local);
});
afterEach(() => vi.unstubAllEnvs());

describe("AD.iD federation", () => {
  it("registers a dedicated code client only with complete explicit configuration", () => {
    expect(getAdidConfig({})).toBeNull();
    expect(
      getAdidConfig({ ...cfg, ADID_AUTH0_ISSUER: "http://broker.example" }),
    ).toBeNull();
    for (const [key, value] of Object.entries(cfg)) vi.stubEnv(key, value);
    const provider = buildOAuthProviders().find(
      (p) => p.type === "oauth" && p.options?.id === "adid",
    );
    expect(provider).toMatchObject({
      idToken: true,
      options: {
        checks: ["pkce", "state", "nonce"],
        wellKnown: "https://broker.example/.well-known/openid-configuration",
        authorization: { params: { connection: "clerk-review" } },
      },
    });
  });
  it("requires the verified issuer, signed connection and matching account subject", () => {
    expect(
      adidIdentity(
        { ...claims, iss: "https://other.example/" },
        claims.sub,
        config,
      ),
    ).toBeNull();
    expect(
      adidIdentity(
        { ...claims, [adidConnectionClaim]: "database" },
        claims.sub,
        config,
      ),
    ).toBeNull();
    expect(adidIdentity(claims, "different", config)).toBeNull();
  });
  it("creates a first-time participant and an audit event in the same transaction", async () => {
    expect(await resolveAdidUser(identity, "NZ")).toEqual(local);
    expect(mock.create.mock.calls[0][0].data.primaryRole).toBe("participant");
    expect(
      mock.create.mock.calls[0][0].data.participantProfile.create,
    ).toMatchObject({ jurisdiction: "NZ", timezone: "Pacific/Auckland" });
    expect(mock.bind.mock.calls[0][0].data).toEqual({
      userId: local.id,
      provider: "adid:https://broker.example/",
      externalSubjectId: claims.sub,
    });
    expect(mock.audit).toHaveBeenCalledOnce();
  });
  it("returns a linked user's local profile even when the identity email changes", async () => {
    mock.link.mockResolvedValue({ userId: local.id });
    mock.read.mockResolvedValue(local);
    expect(
      await resolveAdidUser({
        ...identity,
        verifiedEmail: "changed@example.test",
      }),
    ).toEqual(local);
    expect(mock.transaction).not.toHaveBeenCalled();
  });
  it("denies an email collision, a missing verified email and an orphaned link", async () => {
    mock.existing.mockResolvedValue({ id: "someone-else" });
    expect(await resolveAdidUser(identity)).toBeNull();
    expect(
      await resolveAdidUser({ ...identity, verifiedEmail: null }),
    ).toBeNull();
    mock.link.mockResolvedValue({ userId: "removed" });
    mock.read.mockResolvedValue(null);
    expect(await resolveAdidUser(identity)).toBeNull();
    expect(mock.create).not.toHaveBeenCalled();
  });
  it("a concurrent registration can resume only the winning subject binding", async () => {
    mock.transaction.mockRejectedValue({ code: "P2002" });
    mock.link
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ userId: local.id });
    mock.read.mockResolvedValueOnce(local);
    expect(await resolveAdidUser(identity)).toEqual(local);
    expect(await resolveAdidUser(identity)).toBeNull();
  });
});
