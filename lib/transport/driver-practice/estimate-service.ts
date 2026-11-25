import { z } from "zod";

import { corridors } from "./corridors";

export const corridorSchema = z.enum([
  "park-aquatic",
  "aquatic-park",
  "park-library",
]);
const recordSchema = z.object({
  source: z.literal("Mapbox Directions"),
  durationSeconds: z.number().positive().finite(),
  distanceMetres: z.number().positive().finite(),
  generatedAt: z.string().datetime(),
  validUntil: z.string().datetime(),
});
export type Estimate = z.infer<typeof recordSchema>;
type Dependencies = {
  redis: (command: string[]) => Promise<unknown>;
  lookup: (pair: string) => Promise<{ duration: number; distance: number }>;
  clock: () => number;
};
export const CACHE_SECONDS = 120;
export const RETRY_SECONDS = 20;
export async function publicCorridorEstimate(
  id: keyof typeof corridors,
  deps: Dependencies,
): Promise<Estimate | null> {
  const key = "mapable:transport:practice:driving:v1:" + id;
  const cached = await deps.redis(["GET", key]);
  if (typeof cached === "string") {
    let parsed: unknown;
    try {
      parsed = JSON.parse(cached);
    } catch {
      parsed = null;
    }
    const entry = recordSchema.safeParse(parsed);
    if (entry.success && Date.parse(entry.data.validUntil) > deps.clock())
      return entry.data;
  }
  // The short lease also bounds failed upstream requests across server instances.
  const acquired = await deps.redis([
    "SET",
    key + ":refresh",
    "1",
    "EX",
    String(RETRY_SECONDS),
    "NX",
  ]);
  if (acquired !== "OK") return null;
  const result = await deps.lookup(corridors[id]);
  const timestamp = deps.clock();
  const value = recordSchema.parse({
    source: "Mapbox Directions",
    durationSeconds: result.duration,
    distanceMetres: result.distance,
    generatedAt: new Date(timestamp).toISOString(),
    validUntil: new Date(timestamp + CACHE_SECONDS * 1000).toISOString(),
  });
  await deps.redis([
    "SET",
    key,
    JSON.stringify(value),
    "EX",
    String(CACHE_SECONDS),
  ]);
  return value;
}
export function configuredEstimateDependencies(): Dependencies | null {
  const base = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  const mapToken = process.env.MAPBOX_ACCESS_TOKEN?.trim();
  if (
    process.env.MAPABLE_DRIVER_PRACTICE_ROUTING_ENABLED !== "true" ||
    !base?.startsWith("https://") ||
    !redisToken ||
    !mapToken
  )
    return null;
  return {
    clock: Date.now,
    redis: async (command) => {
      const r = await fetch(base, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + redisToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(1500),
      });
      if (!r.ok) throw new Error("Cache unavailable");
      const body = await r.json();
      if (body.error) throw new Error("Cache unavailable");
      return body.result;
    },
    lookup: async (pair) => {
      const url = new URL(
        "https://api.mapbox.com/directions/v5/mapbox/driving/" + pair,
      );
      url.search = new URLSearchParams({
        overview: "false",
        steps: "false",
        access_token: mapToken,
      }).toString();
      const r = await fetch(url, {
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(3000),
      });
      if (!r.ok) throw new Error("Routing unavailable");
      const body = z
        .object({
          code: z.literal("Ok"),
          routes: z
            .array(
              z.object({
                distance: z.number().positive(),
                duration: z.number().positive(),
              }),
            )
            .min(1),
        })
        .parse(await r.json());
      return body.routes[0]!;
    },
  };
}
