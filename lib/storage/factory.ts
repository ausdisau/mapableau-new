import {
  getObjectStorageConfig,
  parseCloudStorageProvider,
} from "@/lib/config/object-storage";

import {
  StorageNotEnabledError,
  UnsupportedStorageProviderError,
} from "./errors";
import type { ObjectStore } from "./object-store";
import { MemoryObjectStore } from "./providers/memory-object-store";
import { SupabaseObjectStore } from "./providers/supabase-object-store";

let cached: { key: string; store: ObjectStore } | null = null;
let memorySingleton: MemoryObjectStore | null = null;

function cacheKey(environment: NodeJS.ProcessEnv): string {
  const config = getObjectStorageConfig(environment);
  return `${config.enabled}:${config.provider}`;
}

/**
 * Domain entry point. Never call vendor SDKs from MapAble domain modules.
 *
 * Requires MAPABLE_OBJECT_STORAGE_ENABLED=true. Provider is selected by
 * CLOUD_STORAGE_PROVIDER (supabase now; S3-compatible later).
 */
export function getObjectStore(
  environment: NodeJS.ProcessEnv = process.env,
): ObjectStore {
  const config = getObjectStorageConfig(environment);
  if (!config.enabled) {
    throw new StorageNotEnabledError();
  }

  const key = cacheKey(environment);
  if (cached && cached.key === key) return cached.store;

  const provider = parseCloudStorageProvider(environment.CLOUD_STORAGE_PROVIDER);
  const mapableEnv = (environment.MAPABLE_ENVIRONMENT ?? "local").toLowerCase();

  let store: ObjectStore;
  switch (provider) {
    case "supabase":
      store = new SupabaseObjectStore();
      break;
    case "memory":
      if (mapableEnv === "production") {
        throw new UnsupportedStorageProviderError("memory");
      }
      if (!memorySingleton) memorySingleton = new MemoryObjectStore();
      store = memorySingleton;
      break;
    case "s3":
      throw new UnsupportedStorageProviderError(
        "s3 (S3-compatible adapter is a documented extension point, not implemented)",
      );
    case "recording":
      throw new UnsupportedStorageProviderError("recording");
    default: {
      const exhaustive: never = provider;
      throw new UnsupportedStorageProviderError(String(exhaustive));
    }
  }

  cached = { key, store };
  return store;
}

/** Test helper — bypasses env cache. */
export function resetObjectStoreCache(): void {
  cached = null;
  memorySingleton = null;
}

export function createMemoryObjectStore(): MemoryObjectStore {
  return new MemoryObjectStore();
}
