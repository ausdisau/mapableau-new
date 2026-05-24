import { describe, expect, it } from "vitest";

import {
  hashOfflinePayload,
  sanitizeOfflinePayload,
} from "@/lib/offline/sync-queue";

describe("offline sync queue", () => {
  it("excludes sensitive keys from offline cache", () => {
    const safe = sanitizeOfflinePayload({
      tripId: "t1",
      ndisNotes: "secret",
      homeAddress: "123 St",
    });
    expect(safe.tripId).toBe("t1");
    expect(safe).not.toHaveProperty("ndisNotes");
    expect(safe).not.toHaveProperty("homeAddress");
  });

  it("hashes payload for sync events", () => {
    expect(hashOfflinePayload({ a: 1 })).toHaveLength(64);
  });
});
