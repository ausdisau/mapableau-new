import { afterEach, describe, expect, it, vi } from "vitest";

describe("getConfiguredOAuthProviders", () => {
  const env = process.env;

  afterEach(() => {
    process.env = { ...env };
    vi.resetModules();
  });

  it("returns false when OAuth env is unset", async () => {
    process.env = {
      ...env,
      GOOGLE_CLIENT_ID: "",
      GOOGLE_CLIENT_SECRET: "",
      AZURE_AD_CLIENT_ID: "",
      AZURE_AD_CLIENT_SECRET: "",
    };
    const { getConfiguredOAuthProviders } = await import(
      "@/lib/auth/oauth-providers"
    );
    expect(getConfiguredOAuthProviders()).toEqual({
      google: false,
      microsoft: false,
      facebook: false,
    });
  });

  it("detects Google when credentials are present", async () => {
    process.env = {
      ...env,
      GOOGLE_CLIENT_ID: "google-id",
      GOOGLE_CLIENT_SECRET: "google-secret",
      AZURE_AD_CLIENT_ID: "",
      AZURE_AD_CLIENT_SECRET: "",
      FACEBOOK_APP_ID: "",
      FACEBOOK_APP_SECRET: "",
    };
    const { getConfiguredOAuthProviders } = await import(
      "@/lib/auth/oauth-providers"
    );
    expect(getConfiguredOAuthProviders().google).toBe(true);
    expect(getConfiguredOAuthProviders().microsoft).toBe(false);
    expect(getConfiguredOAuthProviders().facebook).toBe(false);
  });

  it("detects Facebook when app id and secret are present", async () => {
    process.env = {
      ...env,
      GOOGLE_CLIENT_ID: "",
      GOOGLE_CLIENT_SECRET: "",
      FACEBOOK_APP_ID: "1798843646962949",
      FACEBOOK_APP_SECRET: "fb-secret",
    };
    const { getConfiguredOAuthProviders, buildOAuthProviders } = await import(
      "@/lib/auth/oauth-providers"
    );
    expect(getConfiguredOAuthProviders().facebook).toBe(true);
    expect(buildOAuthProviders().some((p) => p.id === "facebook")).toBe(true);
  });
});
