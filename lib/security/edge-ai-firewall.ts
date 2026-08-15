/**
 * Edge-safe AI / scraping firewall helpers for middleware.ts.
 * Rate limiting is process-local (same honesty as lib/api/ip-rate-limit.ts).
 */

/** Known autonomous / AI crawler User-Agent substrings (case-insensitive). */
export const AI_SCRAPER_USER_AGENTS = [
  "gptbot",
  "chatgpt-user",
  "anthropic-ai",
  "claude-web",
  "claudebot",
  "bytespider",
  "ccbot",
  "google-extended",
  "amazonbot",
  "perplexitybot",
  "cohere-ai",
] as const;

const PROMPT_INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /system\s+override/i,
  /you\s+are\s+now\s+an?\s+admin/i,
  /disregard\s+(all\s+)?prior\s+(instructions|rules)/i,
  /jailbreak/i,
  /do\s+not\s+follow\s+your\s+(system|developer)\s+prompt/i,
];

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 120;

type WindowEntry = { count: number; resetAt: number };
const ipWindows = new Map<string, WindowEntry>();

export function isAiScraperUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return AI_SCRAPER_USER_AGENTS.some((token) => ua.includes(token));
}

export function searchParamsContainPromptInjection(
  searchParams: URLSearchParams,
): boolean {
  for (const [, value] of searchParams.entries()) {
    if (!value) continue;
    if (PROMPT_INJECTION_PATTERNS.some((re) => re.test(value))) {
      return true;
    }
  }
  return false;
}

export function isProtectedFirewallPath(pathname: string): boolean {
  return (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard")
  );
}

/** Paths that should not consume the sliding-window budget (auth handshake). */
export function isRateLimitExemptPath(pathname: string): boolean {
  return (
    pathname.startsWith("/api/auth") ||
    pathname === "/api/health" ||
    pathname.startsWith("/api/health/")
  );
}

export function getEdgeClientIp(request: {
  headers: { get(name: string): string | null };
}): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "anonymous"
  );
}

export type EdgeRateLimitResult = {
  allowed: boolean;
  retryAfterSec: number;
};

/**
 * Sliding-window IP limiter for Edge middleware.
 * Process-local only — see docs/operations/RATE_LIMITING.md.
 */
export function checkEdgeSlidingWindowRateLimit(
  ip: string,
  options: { windowMs?: number; max?: number } = {},
): EdgeRateLimitResult {
  const windowMs = options.windowMs ?? WINDOW_MS;
  const max = options.max ?? MAX_REQUESTS_PER_WINDOW;
  const now = Date.now();
  const entry = ipWindows.get(ip);
  if (!entry || entry.resetAt < now) {
    ipWindows.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }
  if (entry.count >= max) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }
  entry.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

/** Test helper — clears in-memory windows. */
export function __resetEdgeRateLimitForTests(): void {
  ipWindows.clear();
}
