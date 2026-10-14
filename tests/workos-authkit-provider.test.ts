import { afterEach, describe, expect, it, vi } from "vitest";

import {
  isWorkOSAuthKitConfigured,
  refreshWorkOSAuthKitToken,
  workOSAccessTokenExpiresAt,
} from "@/lib/auth/workos-authkit-provider";

const originalEnv = process.env;

function testJwt(exp: number): string {
  const header = Buffer.from(JSON.stringify({ alg: "RS256" })).toString(
    "base64url",
  );
  const payload = Buffer.from(JSON.stringify({ exp })).toString("base64url");
  return `${header}.${payload}.signature`;
}

afterEach(() => {
  process.env = { ...originalEnv };
  vi.unstubAllGlobals();
});

describe("WorkOS AuthKit provider", () => {
  it("fails closed until the flag and both server credentials are present", () => {
    process.env = {
      ...originalEnv,
      WORKOS_AUTHKIT_ENABLED: "false",
      WORKOS_CLIENT_ID: "client_test",
      WORKOS_API_KEY: "sk_test",
    };
    expect(isWorkOSAuthKitConfigured()).toBe(false);

    process.env.WORKOS_AUTHKIT_ENABLED = "true";
    expect(isWorkOSAuthKitConfigured()).toBe(true);
  });

  it("reads JWT expiry without treating the payload as authorization data", () => {
    expect(workOSAccessTokenExpiresAt(testJwt(2_000))).toBe(2_000_000);
    expect(workOSAccessTokenExpiresAt("not-a-jwt")).toBeNull();
  });

  it("refreshes with the server API key and returns only the session tokens", async () => {
    process.env = {
      ...originalEnv,
      WORKOS_CLIENT_ID: "client_test",
      WORKOS_API_KEY: "sk_test",
    };
    const accessToken = testJwt(2_000);
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          user: {
            object: "user",
            id: "user_01",
            email: "person@example.com",
            email_verified: true,
          },
          access_token: accessToken,
          refresh_token: "refresh_next",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(refreshWorkOSAuthKitToken("refresh_current")).resolves.toEqual({
      accessToken,
      refreshToken: "refresh_next",
      accessTokenExpiresAt: 2_000_000,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.workos.com/user_management/authenticate",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer sk_test" }),
        body: JSON.stringify({
          grant_type: "refresh_token",
          refresh_token: "refresh_current",
          client_id: "client_test",
          client_secret: "sk_test",
        }),
      }),
    );
  });
});
