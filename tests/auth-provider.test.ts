import { afterEach, describe, expect, it } from "vitest";

import { isNeonAuthEnabled } from "@/lib/auth/auth-provider";

describe("isNeonAuthEnabled", () => {
  const env = process.env;

  afterEach(() => {
    process.env = { ...env };
  });

  it("returns false when AUTH_PROVIDER is nextauth", () => {
    process.env.AUTH_PROVIDER = "nextauth";
    process.env.NEON_AUTH_BASE_URL = "https://example.neonauth/auth";
    process.env.NEON_AUTH_COOKIE_SECRET = "a".repeat(32);
    expect(isNeonAuthEnabled()).toBe(false);
  });

  it("returns true when AUTH_PROVIDER is neon", () => {
    process.env.AUTH_PROVIDER = "neon";
    expect(isNeonAuthEnabled()).toBe(true);
  });

  it("auto-enables when Neon env is complete", () => {
    delete process.env.AUTH_PROVIDER;
    process.env.NEON_AUTH_BASE_URL = "https://example.neonauth/auth";
    process.env.NEON_AUTH_COOKIE_SECRET = "b".repeat(32);
    expect(isNeonAuthEnabled()).toBe(true);
  });

  it("returns false when cookie secret is too short", () => {
    delete process.env.AUTH_PROVIDER;
    process.env.NEON_AUTH_BASE_URL = "https://example.neonauth/auth";
    process.env.NEON_AUTH_COOKIE_SECRET = "short";
    expect(isNeonAuthEnabled()).toBe(false);
  });
});
