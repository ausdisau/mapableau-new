import { z } from "zod";

import { runPublicMapAbleKnowledgeAgent } from "@/lib/agent/public-mapable-knowledge-agent";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";

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

  if (process.env.MAPABLE_PUBLIC_KNOWLEDGE_ENABLED !== "true") {
    return Response.json(
      { error: "The public knowledge guide is not available right now." },
      { status: 503 },
    );
  }

  try {
    const parsed = requestSchema.parse(await request.json());
    const result = await runPublicMapAbleKnowledgeAgent(parsed.question);
    return Response.json(result, {
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
