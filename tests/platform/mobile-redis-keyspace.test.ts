import { describe, expect, it } from "vitest";

import {
  MOBILE_REDIS_STRUCTURES,
  MOBILE_REDIS_TTL_SECONDS,
  mobileRedisKeys,
} from "@/lib/platform/redis/mobile-keyspace";

describe("MapAble mobile Redis keyspace", () => {
  it("uses stable tenant-prefixed keys without unnecessary hash tags", () => {
    expect(mobileRedisKeys.tenantEventStream("org_123")).toBe(
      "tenant:org_123:mobile:events",
    );
    expect(mobileRedisKeys.userPresence("org_123", "user_456")).toBe(
      "tenant:org_123:mobile:presence:user_456",
    );
    expect(mobileRedisKeys.roomMembership("org_123", "trip_789")).toBe(
      "tenant:org_123:mobile:room:trip_789:members",
    );
  });

  it("requires a digest for public search cache keys so raw queries are not stored in key names", () => {
    const digest = "a".repeat(64);
    expect(mobileRedisKeys.publicAccessSearchCache(digest)).toBe(
      `public:access:search:${digest}`,
    );
    expect(() => mobileRedisKeys.publicAccessSearchCache("wheelchair cafe sydney")).toThrow(
      "cache digest",
    );
  });

  it("rejects unsafe key segments", () => {
    expect(() => mobileRedisKeys.userPresence("org:escape", "user_1")).toThrow(
      "tenantId",
    );
    expect(() => mobileRedisKeys.actionIdempotency("org_1", "action with spaces")).toThrow(
      "actionId",
    );
  });

  it("keeps ephemeral state bounded and selects structures by access pattern", () => {
    expect(MOBILE_REDIS_TTL_SECONDS.presence).toBe(90);
    expect(MOBILE_REDIS_TTL_SECONDS.idempotency).toBe(600);
    expect(MOBILE_REDIS_STRUCTURES.tenantEventStream).toBe("stream");
    expect(MOBILE_REDIS_STRUCTURES.userPresence).toBe("hash");
    expect(MOBILE_REDIS_STRUCTURES.roomMembership).toBe("set");
  });
});
