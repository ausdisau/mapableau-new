import { describe, expect, it } from "vitest";

import { fingerprintManifest } from "@/lib/wallet/backup";

describe("wallet backup manifest fingerprint", () => {
  const base = {
    walletId: "w1",
    keyReferenceIds: ["k2", "k1"],
    recoveryPolicyId: "p1",
    createdAt: "2026-07-17T00:00:00.000Z",
  };

  it("is stable when key order changes", () => {
    const a = fingerprintManifest(base);
    const b = fingerprintManifest({
      ...base,
      keyReferenceIds: ["k1", "k2"],
    });
    expect(a).toBe(b);
  });

  it("changes when walletId changes", () => {
    const a = fingerprintManifest(base);
    const b = fingerprintManifest({ ...base, walletId: "w2" });
    expect(a).not.toBe(b);
  });

  it("changes when recovery policy changes", () => {
    const a = fingerprintManifest(base);
    const b = fingerprintManifest({ ...base, recoveryPolicyId: "p2" });
    expect(a).not.toBe(b);
  });
});
