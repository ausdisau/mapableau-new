import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk, zodErrorResponse } from "@/lib/api/response";
import { suggestWordsAndPhrases } from "@/lib/word-prediction/prediction-service";
import { prisma } from "@/lib/prisma";
import { predictionQuerySchema } from "@/types/word-prediction";
import type { DigitalPreferences } from "@/types/mapable";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 120;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous";
  if (!checkRateLimit(`${user.id}:${ip}`)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 }
    );
  }

  try {
    const params = Object.fromEntries(new URL(req.url).searchParams);
    const input = predictionQuerySchema.parse(params);

    const profile = await prisma.accessibilityProfile.findUnique({
      where: { userId: user.id },
    });
    const digital = (profile?.digitalPreferences ?? {}) as DigitalPreferences & {
      customPhrases?: string[];
      wordPredictionEnabled?: boolean;
    };

    if (digital.wordPredictionEnabled === false) {
      return jsonOk({ suggestions: [], disabled: true });
    }

    const suggestions = suggestWordsAndPhrases({
      query: input.q,
      caret: input.caret,
      context: input.context,
      limit: input.limit,
      customPhrases: digital.customPhrases,
    });

    return jsonOk({ suggestions, disabled: false });
  } catch (e) {
    if (e instanceof ZodError) return zodErrorResponse(e);
    throw e;
  }
}
