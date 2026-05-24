import { describe, expect, it } from "vitest";

import { validateUpload } from "@/lib/security/file-upload-policy";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { validateProductionEnv, safeEnvSummary } from "@/lib/env";

describe("security foundations", () => {
  it("rejects dangerous extensions", () => {
    const result = validateUpload({
      name: "virus.exe",
      type: "application/octet-stream",
      size: 100,
    });
    expect(result.ok).toBe(false);
  });

  it("rate limits repeated requests", () => {
    const key = "test-client";
    const route = "/api/test";
    let last = checkRateLimit(key, route, 3, 60_000);
    expect(last.allowed).toBe(true);
    checkRateLimit(key, route, 3, 60_000);
    checkRateLimit(key, route, 3, 60_000);
    last = checkRateLimit(key, route, 3, 60_000);
    expect(last.allowed).toBe(false);
  });

  it("safe env summary omits secrets", () => {
    const summary = safeEnvSummary();
    expect(summary.STRIPE_CONFIGURED).toBeDefined();
    expect(JSON.stringify(summary)).not.toContain("sk_");
  });

  it("validateProductionEnv lists missing keys", () => {
    const prev = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    const result = validateProductionEnv();
    expect(result.missing).toContain("DATABASE_URL");
    if (prev) process.env.DATABASE_URL = prev;
  });
});
