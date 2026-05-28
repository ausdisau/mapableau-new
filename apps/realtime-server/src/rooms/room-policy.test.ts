import { describe, expect, it } from "vitest";

import {
  canJoinRoom,
  isAllowedRoom,
} from "./room-policy.js";

describe("room-policy", () => {
  it("allows known room prefixes", () => {
    expect(isAllowedRoom("thread:conv-1")).toBe(true);
    expect(isAllowedRoom("invalid:room")).toBe(false);
  });

  it("restricts user rooms to owner", () => {
    expect(canJoinRoom("alice", "user:alice")).toBe(true);
    expect(canJoinRoom("bob", "user:alice")).toBe(false);
  });

  it("allows authenticated users on thread rooms", () => {
    expect(canJoinRoom("any-user", "thread:123")).toBe(true);
  });
});
