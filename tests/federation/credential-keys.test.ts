import { describe, expect, it } from "vitest";

import { isLoggableKeyRef, opaqueKeyRef } from "@/lib/credentials/keys";

describe("opaque key references", () => {
  it("is a 64-hex sha256 digest", () => {
    const ref = opaqueKeyRef({
      scope: "wallet",
      subject: "participant-1",
      purpose: "signing",
      binding: "device-abc",
    });
    expect(ref).toMatch(/^[a-f0-9]{64}$/);
    expect(isLoggableKeyRef(ref)).toBe(true);
  });

  it("is stable for identical inputs", () => {
    const a = opaqueKeyRef({
      scope: "wallet",
      subject: "p",
      purpose: "signing",
      binding: "b",
    });
    const b = opaqueKeyRef({
      scope: "wallet",
      subject: "p",
      purpose: "signing",
      binding: "b",
    });
    expect(a).toBe(b);
  });

  it("differs when subject differs", () => {
    const a = opaqueKeyRef({
      scope: "wallet",
      subject: "p1",
      purpose: "signing",
      binding: "b",
    });
    const b = opaqueKeyRef({
      scope: "wallet",
      subject: "p2",
      purpose: "signing",
      binding: "b",
    });
    expect(a).not.toBe(b);
  });

  it("rejects arbitrary strings via isLoggableKeyRef", () => {
    expect(isLoggableKeyRef("plain-text-password")).toBe(false);
    expect(isLoggableKeyRef("cn=Real Person")).toBe(false);
  });
});
