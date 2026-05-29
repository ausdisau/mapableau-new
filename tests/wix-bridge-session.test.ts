import { afterEach, describe, expect, it } from "vitest";

import {
  createWixBridgeToken,
  verifyWixBridgeToken,
} from "@/lib/auth/wix/wix-bridge-session";

describe("wix-bridge-session", () => {
  const prev = process.env.APP_SECRET;

  afterEach(() => {
    process.env.APP_SECRET = prev;
  });

  it("creates and verifies a one-time bridge token", async () => {
    process.env.APP_SECRET = "test-secret-for-wix-bridge";

    const token = await createWixBridgeToken({
      userId: "user_1",
      returnTo: "/dashboard",
    });

    const payload = await verifyWixBridgeToken(token);
    expect(payload).toEqual({
      userId: "user_1",
      returnTo: "/dashboard",
    });
  });

  it("rejects tampered tokens", async () => {
    process.env.APP_SECRET = "test-secret-for-wix-bridge";
    const token = await createWixBridgeToken({
      userId: "user_1",
      returnTo: "/dashboard",
    });
    const payload = await verifyWixBridgeToken(`${token}x`);
    expect(payload).toBeNull();
  });
});
