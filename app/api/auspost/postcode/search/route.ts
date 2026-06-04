import { isAuspostPacConfigured } from "@/lib/config/auspost-pac";
import {
  AUSPOST_PAC_OPERATIONS,
  auspostPacJsonError,
  auspostPacJsonOk,
} from "@/lib/auspost-pac/api-contract";
import { handleAuspostPacRouteError } from "@/lib/auspost-pac/route-handler";
import { searchPostcodes } from "@/lib/auspost-pac/postcode-search-service";
import { postcodeSearchQuerySchema } from "@/lib/validation/auspost-pac-schemas";

const OPERATION = AUSPOST_PAC_OPERATIONS.postcodeSearch;

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

export async function GET(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "anonymous";

  if (!checkRateLimit(ip)) {
    return auspostPacJsonError(OPERATION, 429, {
      error: "Too many requests. Please wait a moment.",
      code: "RATE_LIMITED",
      retryable: true,
    });
  }

  if (!isAuspostPacConfigured()) {
    return auspostPacJsonError(OPERATION, 503, {
      error: "Australia Post lookup is not configured.",
      code: "AUSPOST_PAC_NOT_CONFIGURED",
      details: { configured: false },
      retryable: false,
    });
  }

  const { searchParams } = new URL(request.url);
  const parsed = postcodeSearchQuerySchema.safeParse({
    q: searchParams.get("q") ?? "",
    state: searchParams.get("state") ?? undefined,
    excludePostBox: searchParams.get("excludePostBox") ?? undefined,
  });

  if (!parsed.success) {
    return auspostPacJsonError(OPERATION, 400, {
      error: "Invalid query",
      code: "INVALID_QUERY",
      details: parsed.error.flatten(),
      retryable: false,
    });
  }

  try {
    const result = await searchPostcodes({
      q: parsed.data.q,
      state: parsed.data.state,
      excludePostBox: parsed.data.excludePostBox ?? true,
    });
    return auspostPacJsonOk(
      OPERATION,
      { ...result, configured: true },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (e) {
    return handleAuspostPacRouteError(e, OPERATION);
  }
}
