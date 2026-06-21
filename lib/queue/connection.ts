import Redis from "ioredis";

import { mapableAgentConfig } from "@/lib/mapable-agent/config";

let redis: Redis | null = null;

export function getRedisConnection(): Redis {
  if (!redis) {
    redis = new Redis(mapableAgentConfig.redisUrl, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
  }
  return redis;
}

export function getQueueConnection() {
  return { url: mapableAgentConfig.redisUrl };
}

export async function closeRedisConnection(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
