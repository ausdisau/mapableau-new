import {
  applyRateLimitHeaders,
  enforceIpRateLimit,
  getClientIp,
} from "@/lib/api/ip-rate-limit";
import {
  featureDisabledResponse,
  indoorApiError,
} from "@/lib/indoor-accessibility/api-errors";
import { isIndoorFeatureEnabled } from "@/lib/indoor-accessibility/feature-flags";
import { resolveVisitPlanShare } from "@/lib/indoor-accessibility/sharing/visit-plan-service";
import { isShareTokenFormat } from "@/lib/indoor-accessibility/verification/correction-service";

type RouteParams = { params: Promise<{ token: string }> };

/** Share-link enumeration protection: tight per-IP budget. */
const SHARE_RATE_LIMIT = {
  windowMs: 60_000,
  max: 30,
  prefix: "visit-plan-share",
} as const;

/**
 * Public shared visit-plan resolver.
 *
 * SECURITY controls:
 * 1. Rate-limit by IP (Upstash when configured, else process-local) + RateLimit-* headers.
 * 2. Require 64-char hex token before any DB round-trip.
 * 3. Active row query enforces `expiresAt > NOW()`; expired/revoked → 410 Gone.
 */
export async function GET(request: Request, { params }: RouteParams) {
  if (!isIndoorFeatureEnabled("sharedVisitPlans")) {
    return featureDisabledResponse("sharedVisitPlans");
  }

  const ip = getClientIp(request);
  const rate = await enforceIpRateLimit(ip, SHARE_RATE_LIMIT);
  const rateHeaders = new Headers();
  applyRateLimitHeaders(rateHeaders, rate);

  if (!rate.allowed) {
    // Do not confirm whether a token exists when the client is flooding guesses.
    const limited = indoorApiError(
      "PARTNER_RATE_LIMITED",
      "Too many share-link requests. Try again later.",
      429,
    );
    rateHeaders.forEach((value, key) => limited.headers.set(key, value));
    return limited;
  }

  const { token } = await params;

  // Validate high-entropy SHA-256 hash shape (64 hex chars) before lookup.
  if (!isShareTokenFormat(token)) {
    const res = indoorApiError(
      "SHARE_LINK_INVALID",
      "Share link not found.",
      404,
    );
    rateHeaders.forEach((value, key) => res.headers.set(key, value));
    return res;
  }

  const result = await resolveVisitPlanShare(token);

  if ("error" in result) {
    if (result.error === "expired" || result.error === "revoked") {
      const res = indoorApiError(
        result.error === "revoked" ? "SHARE_LINK_REVOKED" : "SHARE_LINK_EXPIRED",
        result.error === "revoked"
          ? "This share link has been revoked."
          : "This share link has expired.",
        410,
      );
      rateHeaders.forEach((value, key) => res.headers.set(key, value));
      return res;
    }

    const res = indoorApiError(
      "SHARE_LINK_INVALID",
      "Share link not found.",
      404,
    );
    rateHeaders.forEach((value, key) => res.headers.set(key, value));
    return res;
  }

  const res = Response.json({ plan: result.plan, scopes: result.scopes });
  rateHeaders.forEach((value, key) => res.headers.set(key, value));
  return res;
}
