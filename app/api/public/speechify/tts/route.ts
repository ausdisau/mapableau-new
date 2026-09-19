import { z } from "zod";

import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import {
  SpeechifyNotConfiguredError,
  synthesiseSpeech,
} from "@/lib/speechify/tts";

export const runtime = "nodejs";

const requestSchema = z.object({
  text: z.string().trim().min(1).max(800),
});

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 8;

export async function POST(request: Request) {
  if (process.env.MAPABLE_PUBLIC_TTS_ENABLED !== "true") {
    return Response.json(
      { error: "Public read aloud is not available right now." },
      { status: 503 },
    );
  }

  const ip = getClientIp(request);
  if (
    !checkIpRateLimit(ip, {
      windowMs: RATE_LIMIT_WINDOW_MS,
      max: RATE_LIMIT_MAX,
    })
  ) {
    return Response.json(
      { error: "Read aloud is being used heavily. Please try again shortly." },
      { status: 429 },
    );
  }

  try {
    const { text } = requestSchema.parse(await request.json());
    const audio = await synthesiseSpeech({
      text,
      voiceId: "geffen_32",
    });

    return new Response(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(audio.byteLength),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return Response.json(
        { error: "Read aloud supports up to 800 characters at a time." },
        { status: 400 },
      );
    }

    if (error instanceof SpeechifyNotConfiguredError) {
      return Response.json(
        { error: "Public read aloud is not configured." },
        { status: 503 },
      );
    }

    console.error("[public-speechify-tts]", error);
    return Response.json(
      { error: "Read aloud is temporarily unavailable." },
      { status: 503 },
    );
  }
}
