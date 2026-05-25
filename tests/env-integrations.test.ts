import { describe, expect, it, vi } from "vitest";

import {
  formatEnvIssues,
  validateIntegrationEnv,
  validateCoreEnv,
} from "@/lib/env";

function restoreEnv(snapshot: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(snapshot)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

describe("integration env validation", () => {
  it("disabled optional integration does not require env vars", () => {
    const origStripe = process.env.STRIPE_ENABLED;
    process.env.STRIPE_ENABLED = "false";
    const issues = validateIntegrationEnv().filter(
      (i) => i.integrationKey === "stripe",
    );
    process.env.STRIPE_ENABLED = origStripe;
    expect(issues.length).toBe(0);
  });

  it("enabled stripe requires STRIPE_SECRET_KEY", () => {
    const origEnabled = process.env.STRIPE_ENABLED;
    const origKey = process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_ENABLED = "true";
    delete process.env.STRIPE_SECRET_KEY;
    const issues = validateIntegrationEnv().filter(
      (i) => i.integrationKey === "stripe",
    );
    process.env.STRIPE_ENABLED = origEnabled;
    process.env.STRIPE_SECRET_KEY = origKey;
    expect(issues.some((i) => i.variable === "STRIPE_SECRET_KEY")).toBe(true);
  });

  it("enabled supabase requires prisma URLs and safe Supabase keys", () => {
    const keys = [
      "SUPABASE_ENABLED",
      "DATABASE_URL",
      "DIRECT_URL",
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
    ];
    const snapshot = Object.fromEntries(
      keys.map((key) => [key, process.env[key]]),
    );

    try {
      process.env.SUPABASE_ENABLED = "true";
      for (const key of keys.slice(1)) {
        delete process.env[key];
      }

      const issues = validateIntegrationEnv().filter(
        (i) => i.integrationKey === "supabase",
      );

      expect(issues.some((i) => i.variable === "DATABASE_URL")).toBe(true);
      expect(issues.some((i) => i.variable === "DIRECT_URL")).toBe(true);
      expect(
        issues.some((i) => i.variable === "NEXT_PUBLIC_SUPABASE_URL"),
      ).toBe(true);
      expect(
        issues.some(
          (i) => i.variable === "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
        ),
      ).toBe(true);
      expect(
        issues.some((i) => i.variable === "SUPABASE_SERVICE_ROLE_KEY"),
      ).toBe(true);
    } finally {
      restoreEnv(snapshot);
    }
  });

  it("accepts legacy anon key for Supabase public config", () => {
    const keys = [
      "SUPABASE_REALTIME_ENABLED",
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ];
    const snapshot = Object.fromEntries(
      keys.map((key) => [key, process.env[key]]),
    );

    try {
      process.env.SUPABASE_REALTIME_ENABLED = "true";
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
      delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

      const issues = validateIntegrationEnv();

      expect(
        issues.some(
          (i) => i.variable === "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
        ),
      ).toBe(false);
    } finally {
      restoreEnv(snapshot);
    }
  });

  it("supabase document storage requires bucket and service role", () => {
    const keys = [
      "DOCUMENT_STORAGE_MODE",
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
      "SUPABASE_STORAGE_BUCKET",
    ];
    const snapshot = Object.fromEntries(
      keys.map((key) => [key, process.env[key]]),
    );

    try {
      process.env.DOCUMENT_STORAGE_MODE = "supabase";
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable-key";
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.SUPABASE_STORAGE_BUCKET;

      const issues = validateIntegrationEnv().filter(
        (i) => i.integrationKey === "supabase",
      );

      expect(
        issues.some((i) => i.variable === "SUPABASE_SERVICE_ROLE_KEY"),
      ).toBe(true);
      expect(issues.some((i) => i.variable === "SUPABASE_STORAGE_BUCKET")).toBe(
        true,
      );
    } finally {
      restoreEnv(snapshot);
    }
  });

  it("formatEnvIssues does not include secret values", () => {
    const text = formatEnvIssues([
      {
        variable: "STRIPE_SECRET_KEY",
        message: "Required",
        integrationKey: "stripe",
      },
    ]);
    expect(text).not.toContain("sk_live");
    expect(text).toContain("STRIPE_SECRET_KEY");
  });
});

describe("core env validation", () => {
  it("production requires DATABASE_URL when NODE_ENV production", () => {
    const origDb = process.env.DATABASE_URL;
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.DATABASE_URL;
    const issues = validateCoreEnv();
    vi.unstubAllEnvs();
    process.env.DATABASE_URL = origDb;
    expect(issues.some((i) => i.variable === "DATABASE_URL")).toBe(true);
  });
});
