import { describe, expect, it } from "vitest";

import { isProhibitedStatement } from "@/lib/access-passport/claims";

describe("access passport prohibited claim statements", () => {
  it("flags 'NDIS number is 43012345'", () => {
    expect(isProhibitedStatement("My NDIS number is 43012345")).toBe(true);
  });

  it("flags 'medicare number'", () => {
    expect(isProhibitedStatement("Medicare number 2345 6789 0")).toBe(true);
  });

  it("flags 'DVA id'", () => {
    expect(isProhibitedStatement("DVA id V123456")).toBe(true);
  });

  it("permits a functional statement", () => {
    expect(
      isProhibitedStatement("Prefers written communication in Auslan-friendly formats")
    ).toBe(false);
  });

  it("permits an environment-oriented preference", () => {
    expect(
      isProhibitedStatement("Needs step-free entry to any venue and a quiet room before a meeting")
    ).toBe(false);
  });
});
