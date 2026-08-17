import { afterEach, describe, expect, it } from "vitest";

import {
  StorageNotEnabledError,
  UnsupportedStorageProviderError,
} from "@/lib/storage/errors";
import {
  getObjectStore,
  resetObjectStoreCache,
} from "@/lib/storage/factory";
import { MemoryObjectStore } from "@/lib/storage/providers/memory-object-store";
import { SupabaseObjectStore } from "@/lib/storage/providers/supabase-object-store";

describe("getObjectStore factory", () => {
  afterEach(() => {
    resetObjectStoreCache();
    delete process.env.MAPABLE_OBJECT_STORAGE_ENABLED;
    delete process.env.CLOUD_STORAGE_PROVIDER;
    delete process.env.MAPABLE_ENVIRONMENT;
  });

  it("throws when the feature flag is off", () => {
    process.env.MAPABLE_OBJECT_STORAGE_ENABLED = "false";
    expect(() => getObjectStore()).toThrow(StorageNotEnabledError);
  });

  it("rejects recording provider", () => {
    process.env.MAPABLE_OBJECT_STORAGE_ENABLED = "true";
    process.env.CLOUD_STORAGE_PROVIDER = "recording";
    expect(() => getObjectStore()).toThrow(UnsupportedStorageProviderError);
  });

  it("rejects s3 until the ObjectStore adapter exists", () => {
    process.env.MAPABLE_OBJECT_STORAGE_ENABLED = "true";
    process.env.CLOUD_STORAGE_PROVIDER = "s3";
    expect(() => getObjectStore()).toThrow(/s3/);
  });

  it("returns memory store outside production", () => {
    process.env.MAPABLE_OBJECT_STORAGE_ENABLED = "true";
    process.env.CLOUD_STORAGE_PROVIDER = "memory";
    process.env.MAPABLE_ENVIRONMENT = "test";
    expect(getObjectStore()).toBeInstanceOf(MemoryObjectStore);
  });

  it("forbids memory store in production", () => {
    process.env.MAPABLE_OBJECT_STORAGE_ENABLED = "true";
    process.env.CLOUD_STORAGE_PROVIDER = "memory";
    process.env.MAPABLE_ENVIRONMENT = "production";
    expect(() => getObjectStore()).toThrow(UnsupportedStorageProviderError);
  });

  it("returns supabase adapter when selected", () => {
    process.env.MAPABLE_OBJECT_STORAGE_ENABLED = "true";
    process.env.CLOUD_STORAGE_PROVIDER = "supabase";
    expect(getObjectStore()).toBeInstanceOf(SupabaseObjectStore);
  });
});
