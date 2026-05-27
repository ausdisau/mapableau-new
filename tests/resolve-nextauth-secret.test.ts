import { afterEach, describe, expect, it } from "vitest";

import { resolveNextAuthSecret } from "@/lib/auth/resolve-nextauth-secret";

describe("resolveNextAuthSecret", () => {
  const priorNext = process.env.NEXTAUTH_SECRET;
  const priorAuth = process.env.AUTH_SECRET;

  afterEach(() => {
    if (priorNext === undefined) delete process.env.NEXTAUTH_SECRET;
    else process.env.NEXTAUTH_SECRET = priorNext;
    if (priorAuth === undefined) delete process.env.AUTH_SECRET;
    else process.env.AUTH_SECRET = priorAuth;
  });

  it("prefers NEXTAUTH_SECRET over AUTH_SECRET", () => {
    process.env.NEXTAUTH_SECRET = "next";
    process.env.AUTH_SECRET = "auth";
    expect(resolveNextAuthSecret()).toBe("next");
  });

  it("falls back to AUTH_SECRET when NEXTAUTH_SECRET is unset", () => {
    delete process.env.NEXTAUTH_SECRET;
    process.env.AUTH_SECRET = "auth-only";
    expect(resolveNextAuthSecret()).toBe("auth-only");
  });

  it("returns undefined when neither is set", () => {
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.AUTH_SECRET;
    expect(resolveNextAuthSecret()).toBeUndefined();
  });
});
