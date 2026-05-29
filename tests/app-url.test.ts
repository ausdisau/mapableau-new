import { afterEach, describe, expect, it } from "vitest";

import {
  getAppBaseUrl,
  getAuthCallbackUrl,
  getWixRedirectUri,
  MAPABLE_SUPABASE_REDIRECT_URLS,
} from "@/lib/app-url";

describe("app-url", () => {
  const prevAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  const prevNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = prevAppUrl;
    process.env.NODE_ENV = prevNodeEnv;
  });

  it("defaults to mapable.com.au in production without env override", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    process.env.NODE_ENV = "production";
    expect(getAppBaseUrl()).toBe("https://mapable.com.au");
    expect(getAuthCallbackUrl()).toBe("https://mapable.com.au/auth/callback");
    expect(getWixRedirectUri()).toBe(
      "https://mapable.com.au/login/wix/callback"
    );
  });

  it("uses localhost in development without env override", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    process.env.NODE_ENV = "development";
    expect(getAppBaseUrl()).toBe("http://localhost:3000");
  });

  it("documents production Supabase redirect URLs", () => {
    expect(MAPABLE_SUPABASE_REDIRECT_URLS).toContain(
      "https://mapable.com.au/auth/callback"
    );
    expect(MAPABLE_SUPABASE_REDIRECT_URLS).toContain(
      "https://www.mapable.com.au/auth/callback"
    );
  });
});
