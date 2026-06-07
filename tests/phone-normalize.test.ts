import { describe, expect, it } from "vitest";

import { normalizePhoneForTwilio } from "@/lib/auth/phone-normalize";

describe("normalizePhoneForTwilio", () => {
  it("normalizes Australian mobile numbers", () => {
    expect(normalizePhoneForTwilio("0412 345 678")).toBe("+61412345678");
    expect(normalizePhoneForTwilio("04 1234 5678")).toBe("+61412345678");
  });

  it("accepts E.164 input", () => {
    expect(normalizePhoneForTwilio("+61412345678")).toBe("+61412345678");
  });

  it("rejects invalid numbers", () => {
    expect(normalizePhoneForTwilio("123")).toBeNull();
    expect(normalizePhoneForTwilio("")).toBeNull();
  });
});
