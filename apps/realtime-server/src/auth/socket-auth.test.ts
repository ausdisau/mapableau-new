import { describe, expect, it, afterEach } from "vitest";

import {
  authenticateSocketToken,
  createSocketAuthToken,
} from "./socket-auth.js";

describe("socket-auth", () => {
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
  });

  it("accepts dev tokens when enabled", () => {
    process.env.SOCKET_ALLOW_DEV_TOKEN = "true";
    delete process.env.SOCKET_AUTH_SECRET;
    const result = authenticateSocketToken("mapable.dev:alice");
    expect(result).toEqual({ ok: true, userId: "alice" });
  });

  it("validates signed tokens", () => {
    process.env.SOCKET_AUTH_SECRET = "test-secret";
    delete process.env.SOCKET_ALLOW_DEV_TOKEN;
    const token = createSocketAuthToken("alice");
    expect(authenticateSocketToken(token)).toEqual({ ok: true, userId: "alice" });
    expect(authenticateSocketToken("alice.wrong")).toEqual({
      ok: false,
      reason: "invalid_signature",
    });
  });

  it("rejects missing token", () => {
    expect(authenticateSocketToken("")).toEqual({
      ok: false,
      reason: "missing_token",
    });
  });
});
