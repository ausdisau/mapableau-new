import { afterEach, describe, expect, it } from "vitest";

import { setRoomMembershipVerifier } from "../../apps/realtime-server/src/rooms/room-membership";
import {
  canJoinRoom,
  isAllowedRoom,
  parseSensitiveRoom,
} from "../../apps/realtime-server/src/rooms/room-policy";

describe("realtime room policy", () => {
  afterEach(() => {
    setRoomMembershipVerifier(null);
  });

  it("parses trip_/care_ sensitive rooms", () => {
    expect(parseSensitiveRoom("trip_abc123")).toEqual({
      resourceType: "trip",
      resourceId: "abc123",
    });
    expect(parseSensitiveRoom("care:booking_9")).toEqual({
      resourceType: "care",
      resourceId: "booking_9",
    });
    expect(parseSensitiveRoom("thread:xyz")).toBeNull();
  });

  it("allows non-sensitive prefixes for authenticated users", async () => {
    expect(isAllowedRoom("thread:abc")).toBe(true);
    const ok = await canJoinRoom("user_1", "participant", "thread:abc");
    expect(ok.allowed).toBe(true);
  });

  it("denies trip_/care_ without verified membership lookup", async () => {
    setRoomMembershipVerifier(async () => ({
      allowed: false,
      reason: "trip_not_member",
    }));

    const denied = await canJoinRoom(
      "user_1",
      "participant",
      "trip_transportBooking1",
    );
    expect(denied.allowed).toBe(false);
    expect(denied.reason).toBe("trip_not_member");
  });

  it("allows trip_/care_ only after membership verifier approves", async () => {
    setRoomMembershipVerifier(async (q) => ({
      allowed: q.resourceId === "owned",
      reason: q.resourceId === "owned" ? "trip_participant" : "denied",
    }));

    const allowed = await canJoinRoom("user_1", "participant", "trip_owned");
    expect(allowed.allowed).toBe(true);

    const blocked = await canJoinRoom("user_1", "participant", "care_other");
    expect(blocked.allowed).toBe(false);
  });

  it("rejects user: rooms that do not match the caller", async () => {
    const denied = await canJoinRoom("user_1", "participant", "user:user_2");
    expect(denied.allowed).toBe(false);
  });
});
