import { describe, expect, it } from "vitest";

import { createCorrelationId } from "@/lib/ndis-gateway/infrastructure/correlation";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("createCorrelationId", () => {
  it("returns a UUID string", () => {
    expect(createCorrelationId()).toMatch(UUID_RE);
  });

  it("returns unique values", () => {
    const ids = new Set(Array.from({ length: 20 }, () => createCorrelationId()));
    expect(ids.size).toBe(20);
  });
});
