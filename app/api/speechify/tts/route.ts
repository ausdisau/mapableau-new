import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import {
  SpeechifyNotConfiguredError,
  SpeechifySynthesisError,
  speechifyTtsRequestSchema,
  synthesiseSpeech,
} from "@/lib/speechify/tts";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    const input = speechifyTtsRequestSchema.parse(await req.json());
    const audio = await synthesiseSpeech(input);

    return new Response(audio, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(audio.byteLength),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof ZodError) {
      return Response.json(
        { error: "Enter between 1 and 2000 characters to read aloud." },
        { status: 400 },
      );
    }

    if (error instanceof SpeechifyNotConfiguredError) {
      return Response.json(
        { error: "Text-to-speech is not configured." },
        { status: 503 },
      );
    }

    if (error instanceof SpeechifySynthesisError) {
      return Response.json(
        { error: "Text-to-speech is temporarily unavailable." },
        { status: 503 },
      );
    }

    return Response.json(
      { error: "Text-to-speech is temporarily unavailable." },
      { status: 500 },
    );
  }
}
