import { describe, expect, it } from "vitest";

import { generateInviteToken } from "@/lib/workers/worker-invitation-service";

describe("worker affiliation helpers", () => {
  it("generates unique invite tokens", () => {
    const a = generateInviteToken();
    const b = generateInviteToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(20);
  });
});
