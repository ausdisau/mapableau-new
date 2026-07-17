import { describe, expect, it } from "vitest";

import {
  canonicalisePublicationPackage,
  hashPublicationPackage,
  verifyPublicationChecksum,
} from "@/lib/accountability/snapshot-hash";

describe("publication snapshot hashing", () => {
  it("canonicalises object key order", () => {
    const a = canonicalisePublicationPackage({ b: 1, a: 2 });
    const b = canonicalisePublicationPackage({ a: 2, b: 1 });
    expect(a).toBe(b);
  });

  it("produces stable sha256 checksums", () => {
    const payload = { title: "demo", metrics: { a: 1, b: [2, 3] } };
    const hash = hashPublicationPackage(payload);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(verifyPublicationChecksum(payload, hash)).toBe(true);
    expect(
      verifyPublicationChecksum({ ...payload, title: "other" }, hash)
    ).toBe(false);
  });
});
