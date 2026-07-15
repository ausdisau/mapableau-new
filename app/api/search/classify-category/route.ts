import { z } from "zod";

import { isGeminiCategoryClassifierEnabled } from "@/lib/config/search-interpreter";
import { classifyServiceCategoryWithGemini } from "@/lib/search/interpreter/gemini-category-classifier";
import {
  SEARCH_CLASSIFY_CATEGORY_OPERATIONS,
  searchClassifyCategoryJsonError,
  searchClassifyCategoryJsonOk,
} from "@/lib/search/search-classify-category-api-contract";

const OPERATION = SEARCH_CLASSIFY_CATEGORY_OPERATIONS.classifyCategory;

const requestSchema = z.object({
  query: z.string().min(1).max(500),
});

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "anonymous";

  if (!checkRateLimit(ip)) {
    return searchClassifyCategoryJsonError(OPERATION, 429, {
      error: "Too many requests. Please wait a moment.",
      code: "RATE_LIMITED",
      retryable: true,
    });
  }

  if (!isGeminiCategoryClassifierEnabled()) {
    return searchClassifyCategoryJsonError(OPERATION, 503, {
      error:
        "Gemini service category classifier is not configured. Set GOOGLE_GENERATIVE_AI_API_KEY or AI_GATEWAY_API_KEY.",
      code: "SEARCH_CLASSIFY_NOT_CONFIGURED",
      retryable: false,
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return searchClassifyCategoryJsonError(OPERATION, 400, {
      error: "Invalid JSON body",
      code: "SEARCH_CLASSIFY_VALIDATION_ERROR",
      retryable: false,
    });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return searchClassifyCategoryJsonError(OPERATION, 400, {
      error: "Invalid request",
      code: "SEARCH_CLASSIFY_VALIDATION_ERROR",
      details: parsed.error.flatten(),
      retryable: false,
    });
  }

  try {
    const result = await classifyServiceCategoryWithGemini(parsed.data.query);
    return searchClassifyCategoryJsonOk(OPERATION, {
      query: parsed.data.query.trim(),
      slug: result.slug,
      confidence: result.confidence,
      source: result.source,
      engineId: result.engineId,
      configured: true,
    });
  } catch (err) {
    console.error("[search-classify-category]", err);
    return searchClassifyCategoryJsonError(OPERATION, 502, {
      error: "Could not classify the service category.",
      code: "SEARCH_CLASSIFY_UPSTREAM_ERROR",
      retryable: true,
    });
  }
}
