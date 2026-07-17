import { describe, expect, it } from "vitest";

import {
  acquireIdempotency,
  computeIdempotencyKey,
  type IdempotencyStore,
} from "@/lib/aura/execution/idempotency";

function memStore(): IdempotencyStore {
  const map = new Map<string, { createdAt: Date; snapshot: unknown }>();
  return {
    async get(key) {
      return map.get(key) ?? null;
    },
    async put(key, snapshot) {
      map.set(key, { createdAt: new Date(), snapshot });
    },
  };
}

describe("execution idempotency", () => {
  it("same inputs => same key", () => {
    const a = computeIdempotencyKey({
      planId: "p1",
      stepIndex: 3,
      attempt: 2,
      inputHash: "h",
    });
    const b = computeIdempotencyKey({
      planId: "p1",
      stepIndex: 3,
      attempt: 2,
      inputHash: "h",
    });
    expect(a).toBe(b);
  });

  it("different attempt => different key", () => {
    const a = computeIdempotencyKey({
      planId: "p1",
      stepIndex: 3,
      attempt: 1,
      inputHash: "h",
    });
    const b = computeIdempotencyKey({
      planId: "p1",
      stepIndex: 3,
      attempt: 2,
      inputHash: "h",
    });
    expect(a).not.toBe(b);
  });

  it("acquireIdempotency reuses stored value on retry", async () => {
    const store = memStore();
    let produced = 0;
    const key = "k1";
    const one = await acquireIdempotency(key, store, async () => {
      produced += 1;
      return { result: "ok" };
    });
    const two = await acquireIdempotency(key, store, async () => {
      produced += 1;
      return { result: "should_not_run" };
    });
    expect(one.reused).toBe(false);
    expect(two.reused).toBe(true);
    expect(produced).toBe(1);
    expect(two.value).toEqual({ result: "ok" });
  });
});
