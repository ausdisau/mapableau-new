import { afterEach, describe, expect, it } from "vitest";

import {
  isWixConfigured,
  isWixEnabled,
  isWixPublicEnabled,
} from "@/lib/auth/wix/wix-config";

describe("wix-config", () => {
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
  });

  it("is disabled by default", () => {
    delete process.env.WIX_ENABLED;
    delete process.env.NEXT_PUBLIC_WIX_ENABLED;
    expect(isWixEnabled()).toBe(false);
    expect(isWixPublicEnabled()).toBe(false);
  });

  it("reports configured when required vars are set", () => {
    process.env.WIX_CLIENT_ID = "client";
    process.env.WIX_REDIRECT_URI = "http://localhost:3000/login/wix/callback";
    process.env.WIX_LOGIN_ORIGIN_URI = "http://localhost:3000/login";
    expect(isWixConfigured()).toBe(true);
  });
});
