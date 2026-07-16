import { createAgentUIStreamResponse } from "ai";
import type { UIMessage } from "ai";
import { z } from "zod";

import { createAccessIntelligenceAgent } from "@/lib/access-intelligence/agent";
import {
  accessIntelligenceConfig,
  isAccessIntelligenceAiConfigured,
} from "@/lib/access-intelligence/configuration";
import {
  AccessIntelligenceError,
  isAccessIntelligenceError,
} from "@/lib/access-intelligence/errors";
import { createServerAccessContext } from "@/lib/access-intelligence/server-context";
import { getCurrentUser } from "@/lib/auth/current-user";

export const maxDuration = 60;

const bodySchema = z.object({
  messages: z.array(z.unknown()).min(1).max(40),
  passportId: z.string().optional(),
  id: z.string().optional(),
});

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > accessIntelligenceConfig.maxChatBodyBytes) {
    return Response.json(
      {
        error: "Request is too large.",
        code: "VALIDATION_ERROR",
        recoveryHint: "Shorten the conversation and try again.",
      },
      { status: 413 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json(
      {
        error: "Invalid JSON body.",
        code: "VALIDATION_ERROR",
        recoveryHint: "Reload the page and send your question again.",
      },
      { status: 400 },
    );
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      {
        error: "Invalid chat payload.",
        code: "VALIDATION_ERROR",
        recoveryHint: "Refresh and try a shorter message.",
      },
      { status: 400 },
    );
  }

  if (!isAccessIntelligenceAiConfigured()) {
    return Response.json(
      new AccessIntelligenceError(
        "AI_PROVIDER_UNAVAILABLE",
        "The AI provider is not configured.",
        "Set AI_GATEWAY_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY to enable streaming chat. Passport editing and demo engines still work.",
      ).toPublicJson(),
      { status: 503 },
    );
  }

  try {
    const user = await getCurrentUser();
    const ctx = createServerAccessContext({
      userId: user?.id,
      organisationId: null,
      selectedPassportId: parsed.data.passportId ?? null,
    });

    if (!ctx.userId) {
      return Response.json(
        new AccessIntelligenceError(
          "UNAUTHORISED",
          "Sign in is required outside demo mode.",
          "Sign in, or enable ACCESS_INTELLIGENCE_DEMO_MODE.",
        ).toPublicJson(),
        { status: 401 },
      );
    }

    const agent = createAccessIntelligenceAgent(ctx);

    return createAgentUIStreamResponse({
      agent,
      uiMessages: parsed.data.messages as UIMessage[],
      abortSignal: request.signal,
    });
  } catch (error) {
    if (isAccessIntelligenceError(error)) {
      const status =
        error.code === "UNAUTHORISED"
          ? 401
          : error.code === "AI_PROVIDER_UNAVAILABLE"
            ? 503
            : 400;
      return Response.json(error.toPublicJson(), { status });
    }
    console.error("[access-intelligence/chat] unexpected error");
    return Response.json(
      {
        error: "Could not process your access question.",
        code: "AI_PROVIDER_UNAVAILABLE",
        recoveryHint:
          "Try again in a moment. You can still browse demo places and edit your passport.",
      },
      { status: 502 },
    );
  }
}
