import { afterEach, describe, expect, it } from "vitest";

import {
  createPublicSpeechToken,
  verifyPublicSpeechToken,
} from "@/lib/speechify/public-read-aloud";

const ORIGINAL_SECRET = process.env.MAPABLE_PUBLIC_TTS_SIGNING_SECRET;

afterEach(() => {
  if (ORIGINAL_SECRET === undefined) {
    delete process.env.MAPABLE_PUBLIC_TTS_SIGNING_SECRET;
  } else {
    process.env.MAPABLE_PUBLIC_TTS_SIGNING_SECRET = ORIGINAL_SECRET;
  }
});

describe("public Speechify read-aloud grants", () => {
  it("accepts the exact signed answer during its lifetime", () => {
    process.env.MAPABLE_PUBLIC_TTS_SIGNING_SECRET = "unit-test-only-secret";
    const now = Date.parse("2026-09-19T08:00:00.000Z");
    const token = createPublicSpeechToken("Hello MapAble", now);

    expect(verifyPublicSpeechToken("Hello MapAble", token, now + 60_000)).toBe(
      true,
    );
  });

  it("rejects modified text", () => {
    process.env.MAPABLE_PUBLIC_TTS_SIGNING_SECRET = "unit-test-only-secret";
    const now = Date.parse("2026-09-19T08:00:00.000Z");
    const token = createPublicSpeechToken("Approved answer", now);

    expect(verifyPublicSpeechToken("Different text", token, now)).toBe(false);
  });

  it("rejects expired grants", () => {
    process.env.MAPABLE_PUBLIC_TTS_SIGNING_SECRET = "unit-test-only-secret";
    const now = Date.parse("2026-09-19T08:00:00.000Z");
    const token = createPublicSpeechToken("Hello MapAble", now);

    expect(
      verifyPublicSpeechToken("Hello MapAble", token, now + 11 * 60_000),
    ).toBe(false);
  });
});
