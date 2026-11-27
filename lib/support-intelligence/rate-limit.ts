import { checkIpRateLimit } from "@/lib/api/ip-rate-limit";

type RateLimitResult = {
  allowed: boolean;
  backend: "upstash" | "process_local";
  distributed: boolean;
};

let warnedMissingUpstash = false;

/**
 * Distributed rate limit when Upstash Redis REST is configured; otherwise
 * process-local fallback. Sensitive Support Intelligence mutations must
 * treat `distributed: false` as a deployment blocker (see readiness report).
 */
export async function checkDistributedRateLimit(
  key: string,
  options: { windowMs: number; max: number },
): Promise<RateLimitResult> {
  const restUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (restUrl && token) {
    try {
      const bucket = Math.floor(Date.now() / options.windowMs);
      const redisKey = `si:rl:${key}:${bucket}`;
      const base = restUrl.replace(/\/$/, "");
      const incr = await fetch(`${base}/incr/${encodeURIComponent(redisKey)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!incr.ok) throw new Error(`UPSTASH_INCR_${incr.status}`);
      const body = (await incr.json()) as { result?: number };
      const count = typeof body.result === "number" ? body.result : 1;
      if (count === 1) {
        const ttlSec = Math.ceil(options.windowMs / 1000);
        await fetch(
          `${base}/expire/${encodeURIComponent(redisKey)}/${ttlSec}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
      }
      return {
        allowed: count <= options.max,
        backend: "upstash",
        distributed: true,
      };
    } catch {
      // Fall through to process-local on Upstash errors.
    }
  } else if (!warnedMissingUpstash && process.env.NODE_ENV !== "test") {
    warnedMissingUpstash = true;
    console.warn(
      "[support-intelligence] Upstash not configured; using process-local rate limit",
    );
  }

  return {
    allowed: checkIpRateLimit(key, options),
    backend: "process_local",
    distributed: false,
  };
}
