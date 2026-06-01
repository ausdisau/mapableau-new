import { afterEach, describe, expect, it, vi } from "vitest";

describe("resolveNextAuthSecret", () => {
  const env = process.env;

  afterEach(() => {
    process.env = { ...env };
    vi.resetModules();
  });

  it("returns NEXTAUTH_SECRET when long enough", async () => {
    process.env = {
      ...env,
      NODE_ENV: "development",
      NEXTAUTH_SECRET: "a".repeat(32),
    };
    const { resolveNextAuthSecret } = await import(
      "@/lib/auth/resolve-nextauth-secret"
    );
    expect(resolveNextAuthSecret()).toBe("a".repeat(32));
  });

  it("falls back to SESSION_SECRET", async () => {
    process.env = {
      ...env,
      NODE_ENV: "development",
      NEXTAUTH_SECRET: "",
      SESSION_SECRET: "b".repeat(32),
    };
    const { resolveNextAuthSecret } = await import(
      "@/lib/auth/resolve-nextauth-secret"
    );
    expect(resolveNextAuthSecret()).toBe("b".repeat(32));
  });

  it("returns undefined in production when unset", async () => {
    process.env = {
      ...env,
      NODE_ENV: "production",
      NEXTAUTH_SECRET: "",
      SESSION_SECRET: "",
      AUTH_SECRET: "",
    };
    const { resolveNextAuthSecret } = await import(
      "@/lib/auth/resolve-nextauth-secret"
    );
    expect(resolveNextAuthSecret()).toBeUndefined();
  });
});
