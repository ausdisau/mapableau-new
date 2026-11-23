import { createHmac } from "crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  mintSocketAuthToken,
  resolveSocketIdentity,
  verifySignedSocketToken,
} from "../../apps/realtime-server/src/auth/socket-auth";
import {
  authorizeRoomJoin,
  RoomAuthorizationError,
} from "../../apps/realtime-server/src/rooms/room-policy";

describe("realtime socket JWT auth", () => {
  beforeEach(() => {
    process.env.SOCKETIO_AUTH_SECRET = "test-socket-secret-32chars-min!!";
    delete process.env.SOCKETIO_MEMBERSHIP_URL;
    delete process.env.SOCKETIO_INTERNAL_TOKEN;
  });

  afterEach(() => {
    delete process.env.SOCKETIO_AUTH_SECRET;
    delete process.env.SOCKETIO_MEMBERSHIP_URL;
    delete process.env.SOCKETIO_INTERNAL_TOKEN;
  });

  it("rejects unsigned base64 identity payloads", () => {
    const spoof = Buffer.from(
      JSON.stringify({ userId: "attacker", role: "mapable_admin" }),
    ).toString("base64url");
    expect(verifySignedSocketToken(spoof)).toBeNull();
    expect(resolveSocketIdentity({ token: spoof, userId: "attacker" })).toBeNull();
  });

  it("accepts HMAC-signed tokens and ignores spoofed companion fields", () => {
    const token = mintSocketAuthToken({
      userId: "user-1",
      role: "participant",
      roomGrants: ["booking:abc"],
    });
    const identity = resolveSocketIdentity({
      token,
      userId: "attacker",
      role: "mapable_admin",
    });
    expect(identity).toEqual({
      userId: "user-1",
      role: "participant",
      roomGrants: ["booking:abc"],
    });
  });

  it("rejects expired tokens", () => {
    const token = mintSocketAuthToken(
      { userId: "user-1", role: "participant" },
      { expiresInSec: -10 },
    );
    expect(verifySignedSocketToken(token)).toBeNull();
  });

  it("rejects tokens without exp", () => {
    const secret = process.env.SOCKETIO_AUTH_SECRET!;
    const encoded = Buffer.from(
      JSON.stringify({ userId: "user-1", role: "participant" }),
      "utf8",
    ).toString("base64url");
    const sig = createHmac("sha256", secret)
      .update(encoded)
      .digest("base64url");
    expect(verifySignedSocketToken(`${encoded}.${sig}`)).toBeNull();
  });
});

describe("realtime room policy", () => {
  beforeEach(() => {
    delete process.env.SOCKETIO_MEMBERSHIP_URL;
    delete process.env.SOCKETIO_INTERNAL_TOKEN;
  });

  it("allows self user room and granted trip room", async () => {
    await expect(
      authorizeRoomJoin(
        { userId: "u1", role: "participant" },
        "user:u1",
      ),
    ).resolves.toMatchObject({ kind: "user" });

    await expect(
      authorizeRoomJoin(
        {
          userId: "u1",
          role: "participant",
          roomGrants: ["trip_abc"],
        },
        "trip_abc",
      ),
    ).resolves.toMatchObject({ kind: "trip" });
  });

  it("denies provider room on role alone without membership", async () => {
    await expect(
      authorizeRoomJoin(
        { userId: "dispatcher-1", role: "transport_operator" },
        "provider:org-other",
      ),
    ).rejects.toBeInstanceOf(RoomAuthorizationError);
  });

  it("fails closed when membership URL set without strong internal token", async () => {
    process.env.SOCKETIO_MEMBERSHIP_URL = "http://localhost:3000/api/internal/socket-membership";
    process.env.SOCKETIO_INTERNAL_TOKEN = "1";
    await expect(
      authorizeRoomJoin(
        { userId: "dispatcher-1", role: "transport_operator" },
        "provider:org-1",
      ),
    ).rejects.toBeInstanceOf(RoomAuthorizationError);
  });
});
