import { afterEach, describe, expect, it } from "vitest";

import { getAuth0SocialConnections } from "@/lib/auth/auth0-social-connections";

describe("getAuth0SocialConnections", () => {
  const env = process.env;

  afterEach(() => {
    process.env = { ...env };
  });

  it("returns empty when Auth0 is not enabled", () => {
    delete process.env.AUTH0_ENABLED;
    expect(getAuth0SocialConnections()).toEqual([]);
  });

  it("returns google, microsoft, and facebook with default connection names", () => {
    process.env.AUTH0_ENABLED = "true";
    process.env.AUTH0_CLIENT_ID = "client";
    process.env.AUTH0_CLIENT_SECRET = "secret";
    process.env.AUTH0_ISSUER = "https://tenant.auth0.com";

    const connections = getAuth0SocialConnections();
    expect(connections.map((c) => c.id)).toEqual(["google", "microsoft", "facebook"]);
    expect(connections.find((c) => c.id === "google")?.connection).toBe(
      "google-oauth2"
    );
    expect(connections.find((c) => c.id === "facebook")?.connection).toBe(
      "facebook"
    );
    expect(connections.find((c) => c.id === "microsoft")?.connection).toBe(
      "windowslive"
    );
  });

  it("respects connection name overrides", () => {
    process.env.AUTH0_ENABLED = "true";
    process.env.AUTH0_CLIENT_ID = "client";
    process.env.AUTH0_CLIENT_SECRET = "secret";
    process.env.AUTH0_ISSUER = "https://tenant.auth0.com";
    process.env.AUTH0_MICROSOFT_CONNECTION = "azuread-mapable";

    const microsoft = getAuth0SocialConnections().find(
      (c) => c.id === "microsoft"
    );
    expect(microsoft?.connection).toBe("azuread-mapable");
  });

  it("can disable individual providers", () => {
    process.env.AUTH0_ENABLED = "true";
    process.env.AUTH0_CLIENT_ID = "client";
    process.env.AUTH0_CLIENT_SECRET = "secret";
    process.env.AUTH0_ISSUER = "https://tenant.auth0.com";
    process.env.AUTH0_SOCIAL_FACEBOOK_ENABLED = "false";

    const ids = getAuth0SocialConnections().map((c) => c.id);
    expect(ids).not.toContain("facebook");
    expect(ids).toContain("google");
  });
});
