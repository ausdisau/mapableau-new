import { afterEach, describe, expect, it } from "vitest";

import {
  isSpeechifyConfigured,
  speechifyTtsRequestSchema,
} from "@/lib/speechify/tts";

describe("Speechify TTS contract", () => {
  const original = process.env.SPEECHIFY_API_KEY;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.SPEECHIFY_API_KEY;
    } else {
      process.env.SPEECHIFY_API_KEY = original;
    }
  });

  it("accepts a short request and supplies the default voice", () => {
    const parsed = speechifyTtsRequestSchema.parse({ text: "Hello MapAble" });
    expect(parsed.voiceId).toBe("geffen_32");
  });

  it("rejects text above the Speechify request limit", () => {
    expect(() =>
      speechifyTtsRequestSchema.parse({ text: "x".repeat(2001) }),
    ).toThrow();
  });

  it("is disabled when the server key is absent", () => {
    delete process.env.SPEECHIFY_API_KEY;
    expect(isSpeechifyConfigured()).toBe(false);
  });
});
