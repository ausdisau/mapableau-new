import { afterEach, describe, expect, it } from "vitest";

import {
  buildSharedSessionCookieOptions,
  resolveMapAbleSessionCookieDomain,
} from "@/lib/auth/session-cookie-domain";

describe("resolveMapAbleSessionCookieDomain", () => {
  const previous = { ...process.env };

  afterEach(() => {
    process.env = { ...previous };
  });

  it("returns .mapable.com.au when NEXT_PUBLIC_APP_URL is apex", () => {
    expect(
      resolveMapAbleSessionCookieDomain({
        NEXT_PUBLIC_APP_URL: "https://mapable.com.au",
      }),
    ).toBe(".mapable.com.au");
  });

  it("returns undefined for localhost", () => {
    expect(
      resolveMapAbleSessionCookieDomain({
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      }),
    ).toBeUndefined();
  });

  it("returns undefined for Vercel preview URLs", () => {
    expect(
      resolveMapAbleSessionCookieDomain({
        NEXT_PUBLIC_APP_URL:
          "https://mapableau-new-git-feature-ausdisau.vercel.app",
        VERCEL_URL: "mapableau-new-git-feature-ausdisau.vercel.app",
      }),
    ).toBeUndefined();
  });

  it("honours explicit MAPABLE_SESSION_COOKIE_DOMAIN override", () => {
    expect(
      resolveMapAbleSessionCookieDomain({
        MAPABLE_SESSION_COOKIE_DOMAIN: ".mapable.com.au",
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      }),
    ).toBe(".mapable.com.au");
  });

  it("builds shared cookie options with parent domain", () => {
    const cookies = buildSharedSessionCookieOptions({
      NEXT_PUBLIC_APP_URL: "https://mapable.com.au",
      NODE_ENV: "production",
    });
    expect(cookies?.sessionToken.options.domain).toBe(".mapable.com.au");
    expect(cookies?.sessionToken.options.secure).toBe(true);
  });
});
