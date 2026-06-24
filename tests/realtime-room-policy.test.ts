import { describe, expect, it } from "vitest";

import { isAllowedRoom } from "@/server/realtime/rooms/room-policy";

describe("realtime room policy", () => {
  it("allows known room prefixes", () => {
    expect(isAllowedRoom("thread:abc")).toBe(true);
    expect(isAllowedRoom("provider:123")).toBe(true);
  });

  it("rejects unknown room prefixes", () => {
    expect(isAllowedRoom("admin:all")).toBe(false);
    expect(isAllowedRoom("")).toBe(false);
  });
});
