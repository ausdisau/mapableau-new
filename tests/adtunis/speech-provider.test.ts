import { describe, expect, it } from "vitest";

import {
  SimulatedSpeechProvider,
  SelfHostedSpeechProvider,
  speechStatus,
  UnavailableProviderStub,
} from "@mapable/adtunis-asr";

describe("adtunis speech providers", () => {
  it("simulates recognition for local demos", async () => {
    const provider = new SimulatedSpeechProvider();
    const result = await provider.recognize({
      audio: Buffer.from("fake"),
      contentType: "audio/webm",
      profileId: "baseline",
    });
    expect(result.raw.length).toBeGreaterThan(0);
    expect(result.uncertainty).toBe("moderate");
  });

  it("fails closed when self-hosted ASR is not approved", async () => {
    const provider = new SelfHostedSpeechProvider({
      ADTUNIS_ASR_APPROVED: "false",
    });
    await expect(
      provider.recognize({
        audio: Buffer.from("fake"),
        contentType: "audio/webm",
        profileId: "baseline",
      }),
    ).rejects.toThrow(/unavailable/i);
  });

  it("rejects public cloud endpoints even if marked approved", async () => {
    const provider = new SelfHostedSpeechProvider({
      ADTUNIS_ASR_APPROVED: "true",
      ADTUNIS_ASR_ENDPOINT: "https://speech.example.com/recognize",
    });
    await expect(
      provider.recognize({
        audio: Buffer.from("fake"),
        contentType: "audio/webm",
        profileId: "baseline",
      }),
    ).rejects.toThrow(/unavailable/i);
  });

  it("exposes simulated status without claiming live ASR", () => {
    const status = speechStatus({ ADTUNIS_SIMULATED_ASR: "true" });
    expect(status.recognitionReady).toBe(true);
    expect(status.simulated).toBe(true);
    expect(status.detail.toLowerCase()).toContain("simulated");
  });

  it("keeps whisper/hf stubs unavailable", async () => {
    const whisper = new UnavailableProviderStub(
      "whisper-compatible",
      "Whisper-compatible provider is not connected in this slice.",
    );
    await expect(whisper.recognize()).rejects.toThrow(/not connected/i);
  });
});
