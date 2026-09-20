import { z } from "zod";

import { runPublicMapAbleKnowledgeAgent } from "@/lib/agent/public-mapable-knowledge-agent";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { createPublicSpeechToken } from "@/lib/speechify/public-read-aloud";

export const runtime = "nodejs";

const requestSchema = z.object({
  question: z.string().trim().min(3).max(1200),
});

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 12;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (
    !checkIpRateLimit(ip, {
      windowMs: RATE_LIMIT_WINDOW_MS,
      max: RATE_LIMIT_MAX,
    })
  ) {
    return Response.json(
      { error: "Too many questions. Please wait a moment and try again." },
      { status: 429 },
    );
  }

  if (
    process.env.MAPABLE_PUBLIC_KNOWLEDGE_ENABLED !== "true" ||
    process.env.MAPABLE_PUBLIC_RATE_LIMIT_VERIFIED !== "true"
  ) {
    return Response.json(
      { error: "The public knowledge guide is not available right now." },
      { status: 503 },
    );
  }

  try {
    const parsed = requestSchema.parse(await request.json());
    const result = await runPublicMapAbleKnowledgeAgent(parsed.question);
    const speechText = result.answer.trim().slice(0, 800);
    const speechToken =
      process.env.MAPABLE_PUBLIC_TTS_ENABLED === "true" &&
      process.env.SPEECHIFY_API_KEY?.trim() &&
      process.env.MAPABLE_PUBLIC_TTS_SIGNING_SECRET?.trim()
        ? createPublicSpeechToken(speechText)
        : undefined;

    return Response.json({ ...result, speechToken }, {
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return Response.json(
        { error: "Ask a question between 3 and 1200 characters." },
        { status: 400 },
      );
    }

    console.error("[public-mapable-knowledge]", error);
    return Response.json(
      { error: "The public knowledge guide is temporarily unavailable." },
      { status: 503 },
    );
  }
}
