import { afterEach, describe, expect, it } from "vitest";

import {
  isAuth0ProviderConfigured,
  resolveAuth0Issuer,
} from "@/lib/auth/auth0-config";

describe("resolveAuth0Issuer", () => {
  const env = process.env;

  afterEach(() => {
    process.env = { ...env };
  });

  it("normalizes domain to https issuer", () => {
    process.env.AUTH0_DOMAIN = "ad-id.au.auth0.com";
    delete process.env.AUTH0_ISSUER;
    expect(resolveAuth0Issuer()).toBe("https://ad-id.au.auth0.com");
  });

  it("strips trailing slash from issuer URL", () => {
    process.env.AUTH0_ISSUER = "https://ad-id.au.auth0.com/";
    delete process.env.AUTH0_DOMAIN;
    expect(resolveAuth0Issuer()).toBe("https://ad-id.au.auth0.com");
  });
});

describe("isAuth0ProviderConfigured", () => {
  const env = process.env;

  afterEach(() => {
    process.env = { ...env };
  });

  it("is false when AUTH0_ENABLED is not set", () => {
    delete process.env.AUTH0_ENABLED;
    process.env.AUTH0_CLIENT_ID = "id";
    process.env.AUTH0_CLIENT_SECRET = "secret";
    process.env.AUTH0_ISSUER = "https://tenant.auth0.com";
    expect(isAuth0ProviderConfigured()).toBe(false);
  });

  it("is true when enabled and credentials are present", () => {
    process.env.AUTH0_ENABLED = "true";
    process.env.AUTH0_CLIENT_ID = "id";
    process.env.AUTH0_CLIENT_SECRET = "secret";
    process.env.AUTH0_ISSUER = "https://tenant.auth0.com";
    expect(isAuth0ProviderConfigured()).toBe(true);
  });
});
