import "server-only";

import { SpeechifyClient, SpeechifyError } from "@speechify/api";
import { z } from "zod";

export const speechifyTtsRequestSchema = z.object({
  text: z.string().trim().min(1).max(2000),
  voiceId: z.string().trim().min(1).default("geffen_32"),
});

export type SpeechifyTtsRequest = z.infer<typeof speechifyTtsRequestSchema>;

export class SpeechifyNotConfiguredError extends Error {
  constructor() {
    super("Speechify text-to-speech is not configured");
    this.name = "SpeechifyNotConfiguredError";
  }
}

export class SpeechifySynthesisError extends Error {
  readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "SpeechifySynthesisError";
    this.statusCode = statusCode;
  }
}

export function isSpeechifyConfigured(): boolean {
  return Boolean(process.env.SPEECHIFY_API_KEY?.trim());
}

function getSpeechifyClient(): SpeechifyClient {
  const token = process.env.SPEECHIFY_API_KEY?.trim();
  if (!token) throw new SpeechifyNotConfiguredError();

  return new SpeechifyClient({
    token,
    version: "2026-09-13",
  });
}

export async function synthesiseSpeech(
  input: SpeechifyTtsRequest,
): Promise<Buffer> {
  const parsed = speechifyTtsRequestSchema.parse(input);
  const client = getSpeechifyClient();

  try {
    const response = await client.audio.speech(
      {
        input: parsed.text,
        voice_id: parsed.voiceId,
        model: "simba-3.2",
        audio_format: "mp3",
      },
      {
        timeoutInSeconds: 30,
        maxRetries: 1,
      },
    );

    if (!response.audio_data) {
      throw new SpeechifySynthesisError("Speechify returned no audio");
    }

    return Buffer.from(response.audio_data, "base64");
  } catch (error) {
    if (error instanceof SpeechifySynthesisError) throw error;

    if (error instanceof SpeechifyError) {
      throw new SpeechifySynthesisError(
        "Speechify synthesis failed",
        error.statusCode,
      );
    }

    throw new SpeechifySynthesisError("Speechify synthesis failed");
  }
}
