import type { ObjectStore } from "../object-store";

/**
 * Compatibility adapter so existing ObjectStorageProvider consumers keep working.
 * New domain code should use ObjectStore via getObjectStore().
 */
export class ObjectStorageProviderAdapter {
  constructor(
    private readonly store: ObjectStore,
    private readonly bucket: string,
  ) {}

  async putObject(input: {
    key: string;
    data: Uint8Array;
    contentType: string;
  }): Promise<{ key: string; version: string; sizeBytes: number }> {
    const stored = await this.store.put({
      key: input.key,
      bucket: this.bucket,
      data: input.data,
      contentType: input.contentType,
    });
    return {
      key: stored.key,
      version: stored.etag ?? "latest",
      sizeBytes: stored.sizeBytes,
    };
  }

  async getObject(input: { key: string; version?: string }): Promise<Uint8Array> {
    const result = await this.store.get({ key: input.key, bucket: this.bucket });
    return result.body;
  }

  async createSignedUrl(input: {
    key: string;
    expiresInSeconds: number;
  }): Promise<string> {
    const signed = await this.store.createSignedReadUrl({
      key: input.key,
      bucket: this.bucket,
      expiresInSeconds: input.expiresInSeconds,
    });
    return signed.url;
  }

  async deleteObject(input: { key: string }): Promise<void> {
    await this.store.remove({ key: input.key, bucket: this.bucket });
  }
}
