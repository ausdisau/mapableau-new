import { ObjectStorageProviderAdapter } from "@/lib/storage/compat/object-storage-provider";
import { S3RestObjectStorageProvider } from "@/lib/storage/compat/s3-rest-storage-provider";
import { SupabaseObjectStore } from "@/lib/storage/providers/supabase-object-store";

export type StoredObject = {
  key: string;
  version: string;
  sizeBytes: number;
};

export interface ObjectStorageProvider {
  putObject(input: {
    key: string;
    data: Uint8Array;
    contentType: string;
  }): Promise<StoredObject>;
  getObject(input: { key: string; version?: string }): Promise<Uint8Array>;
  createSignedUrl(input: {
    key: string;
    expiresInSeconds: number;
  }): Promise<string>;
  deleteObject(input: { key: string }): Promise<void>;
}

export interface QueueProvider {
  publish<T>(topic: string, payload: T): Promise<{ messageId: string }>;
}

export interface CacheProvider {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
}

/**
 * Recording provider for tests and local simulation. It deliberately has no
 * network path and never sends an external message.
 */
export class RecordingQueueProvider implements QueueProvider {
  readonly messages: Array<{ id: string; topic: string; payload: unknown }> =
    [];

  async publish<T>(topic: string, payload: T) {
    const messageId = crypto.randomUUID();
    this.messages.push({ id: messageId, topic, payload });
    return { messageId };
  }
}

export class MemoryCacheProvider implements CacheProvider {
  private readonly values = new Map<string, unknown>();

  async get<T>(key: string): Promise<T | null> {
    return (this.values.get(key) as T | undefined) ?? null;
  }
  async set<T>(key: string, value: T): Promise<void> {
    this.values.set(key, value);
  }
  async delete(key: string): Promise<void> {
    this.values.delete(key);
  }
}

/** HTTP webhook queue — publishes to QUEUE_WEBHOOK_URL or records when unset. */
export class ManagedQueueProvider implements QueueProvider {
  private readonly webhookUrl: string | undefined;
  readonly recordedMessages: Array<{
    id: string;
    topic: string;
    payload: unknown;
  }> = [];

  constructor(webhookUrl = process.env.QUEUE_WEBHOOK_URL?.trim()) {
    this.webhookUrl = webhookUrl || undefined;
  }

  async publish<T>(topic: string, payload: T) {
    const messageId = crypto.randomUUID();
    const envelope = { messageId, topic, payload, publishedAt: new Date().toISOString() };

    if (this.webhookUrl) {
      const response = await fetch(this.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(envelope),
      });
      if (!response.ok) {
        throw new Error(`QUEUE_WEBHOOK_FAILED:${response.status}`);
      }
    } else {
      this.recordedMessages.push({ id: messageId, topic, payload });
    }

    return { messageId };
  }
}

/** Upstash Redis REST — no native Redis client required. */
export class RedisCacheProvider implements CacheProvider {
  private readonly restUrl: string;
  private readonly token: string;

  constructor(
    restUrl = process.env.UPSTASH_REDIS_REST_URL?.trim(),
    token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  ) {
    if (!restUrl || !token) {
      throw new Error("UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required");
    }
    this.restUrl = restUrl.replace(/\/$/, "");
    this.token = token;
  }

  private async command<T>(parts: string[]): Promise<T> {
    const path = parts.map(encodeURIComponent).join("/");
    const response = await fetch(`${this.restUrl}/${path}`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!response.ok) {
      throw new Error(`UPSTASH_REDIS_FAILED:${response.status}`);
    }
    const body = (await response.json()) as { result?: T };
    return body.result as T;
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.command<string | null>(["get", key]);
    if (raw == null) return null;
    return JSON.parse(raw) as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const encoded = JSON.stringify(value);
    if (ttlSeconds != null && ttlSeconds > 0) {
      await this.command(["set", key, encoded, "EX", String(ttlSeconds)]);
    } else {
      await this.command(["set", key, encoded]);
    }
  }

  async delete(key: string): Promise<void> {
    await this.command(["del", key]);
  }
}

/**
 * Compatibility factory for the legacy ObjectStorageProvider contract.
 * New domain code should call getObjectStore() from @/lib/storage.
 */
export function createObjectStorageProvider(
  environment: Record<string, string | undefined> = process.env,
): ObjectStorageProvider {
  const provider = environment.CLOUD_STORAGE_PROVIDER ?? "recording";
  switch (provider) {
    case "recording":
      throw new Error("Recording storage provider is not valid for production use");
    case "supabase": {
      const bucket =
        environment.SUPABASE_STORAGE_BUCKET?.trim() ||
        environment.MAPABLE_STORAGE_PRIVATE_BUCKET?.trim() ||
        "careos";
      return new ObjectStorageProviderAdapter(new SupabaseObjectStore(), bucket);
    }
    case "s3":
      return new S3RestObjectStorageProvider(
        environment.S3_REST_BASE_URL,
        environment.S3_REST_AUTH_HEADER,
      );
    case "memory":
      throw new Error("Memory storage is test-only; use getObjectStore()");
    default: {
      const exhaustive: never = provider as never;
      return exhaustive;
    }
  }
}

export function createCacheProvider(
  environment: Record<string, string | undefined> = process.env,
): CacheProvider {
  const provider = environment.CLOUD_CACHE_PROVIDER ?? "memory";
  switch (provider) {
    case "memory":
      return new MemoryCacheProvider();
    case "redis":
      return new RedisCacheProvider(
        environment.UPSTASH_REDIS_REST_URL,
        environment.UPSTASH_REDIS_REST_TOKEN,
      );
    default: {
      const exhaustive: never = provider as never;
      return exhaustive;
    }
  }
}

export function createQueueProvider(
  environment: Record<string, string | undefined> = process.env,
): QueueProvider {
  const provider = environment.CLOUD_QUEUE_PROVIDER ?? "recording";
  switch (provider) {
    case "recording":
      return new RecordingQueueProvider();
    case "managed":
      return new ManagedQueueProvider(environment.QUEUE_WEBHOOK_URL);
    default: {
      const exhaustive: never = provider as never;
      return exhaustive;
    }
  }
}

/** Dev/test helpers — explicit non-production factories. */
export function createRecordingQueueProvider(): RecordingQueueProvider {
  return new RecordingQueueProvider();
}

export function createMemoryCacheProvider(): MemoryCacheProvider {
  return new MemoryCacheProvider();
}
