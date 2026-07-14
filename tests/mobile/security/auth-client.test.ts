
import { describe, expect, it } from "vitest";
import {
  assertNoClientSecret,
  isAccessTokenExpired,
  buildAuthorizeUrl,
} from "@mapable/auth-client";

describe("auth client security", () => {
  it("rejects embedded server secrets", () => {
    expect(() =>
      assertNoClientSecret({ AUTH0_CLIENT_SECRET: "secret" }),
    ).toThrow(/server secret/);
  });

  it("detects expired access tokens", () => {
    expect(
      isAccessTokenExpired({
        accessToken: "a",
        refreshToken: null,
        expiresAt: Date.now() - 1000,
        tokenType: "Bearer",
      }),
    ).toBe(true);
  });

  it("builds PKCE authorize URL without client secret", () => {
    const url = buildAuthorizeUrl(
      {
        issuer: "https://example.auth0.com",
        clientId: "public-client",
        redirectUri: "mapable://auth/callback",
        scopes: ["openid", "profile"],
        tokenStore: {
          get: async () => null,
          set: async () => undefined,
          clear: async () => undefined,
        },
      },
      {
        codeVerifier: "verifier",
        codeChallenge: "challenge",
        state: "state",
        nonce: "nonce",
      },
    );
    expect(url).toContain("code_challenge=challenge");
    expect(url).not.toContain("client_secret");
  });
});
