import { describe, expect, it } from "vitest";

import { SQUARE_PRINCIPLES } from "@/lib/mapable-square/copy";
import { getSquareRoom, SQUARE_ROOMS } from "@/lib/mapable-square/rooms";
import { threadsForRoom } from "@/lib/mapable-square/seed-threads";

describe("MapAble Square", () => {
  it("defines rooms with unique slugs", () => {
    const slugs = SQUARE_ROOMS.map((r) => r.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("resolves room by slug", () => {
    expect(getSquareRoom("introduce-yourself")?.title).toBe("Introduce yourself");
    expect(getSquareRoom("missing")).toBeUndefined();
  });

  it("sorts threads by last activity descending only", () => {
    const threads = threadsForRoom("access-and-places");
    for (let i = 1; i < threads.length; i++) {
      const prev = new Date(threads[i - 1].lastActivityAt).getTime();
      const curr = new Date(threads[i].lastActivityAt).getTime();
      expect(prev).toBeGreaterThanOrEqual(curr);
    }
  });

  it("documents anti-feed principles", () => {
    expect(SQUARE_PRINCIPLES.some((p) => p.id === "chronology")).toBe(true);
    expect(SQUARE_PRINCIPLES.some((p) => p.id === "transparency")).toBe(true);
  });
});
