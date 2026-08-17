import { ObjectNotFoundError } from "../errors";
import type { ObjectStore } from "../object-store";
import type {
  GetObjectInput,
  ObjectKeyInput,
  ObjectMetadata,
  PutObjectInput,
  RemoveObjectInput,
  SignedObjectUrl,
  SignedReadInput,
  SignedUploadGrant,
  SignedUploadInput,
  StoredObject,
  StoredObjectStream,
} from "../types";

type MemoryRecord = {
  data: Uint8Array;
  contentType: string;
  createdAt: Date;
  etag: string;
};

function recordKey(input: ObjectKeyInput): string {
  return `${input.bucket}::${input.key}`;
}

/**
 * In-memory ObjectStore for unit/integration tests. Not valid for production.
 */
export class MemoryObjectStore implements ObjectStore {
  readonly provider = "memory" as const;
  private readonly objects = new Map<string, MemoryRecord>();

  async put(input: PutObjectInput): Promise<StoredObject> {
    const etag = `mem-${input.data.byteLength}-${Date.now()}`;
    const createdAt = new Date();
    this.objects.set(recordKey(input), {
      data: input.data,
      contentType: input.contentType,
      createdAt,
      etag,
    });
    return {
      key: input.key,
      bucket: input.bucket,
      provider: "memory",
      sizeBytes: input.data.byteLength,
      contentType: input.contentType,
      etag,
      createdAt,
    };
  }

  async get(input: GetObjectInput): Promise<StoredObjectStream> {
    const record = this.objects.get(recordKey(input));
    if (!record) throw new ObjectNotFoundError();
    return {
      body: record.data,
      metadata: this.toMetadata(input, record),
    };
  }

  async remove(input: RemoveObjectInput): Promise<void> {
    this.objects.delete(recordKey(input));
  }

  async exists(input: ObjectKeyInput): Promise<boolean> {
    return this.objects.has(recordKey(input));
  }

  async createSignedReadUrl(input: SignedReadInput): Promise<SignedObjectUrl> {
    if (!(await this.exists(input))) throw new ObjectNotFoundError();
    const expiresAt = new Date(Date.now() + input.expiresInSeconds * 1000);
    return {
      url: `memory://read/${encodeURIComponent(input.bucket)}/${encodeURIComponent(input.key)}?exp=${expiresAt.getTime()}`,
      expiresAt,
      key: input.key,
      bucket: input.bucket,
      provider: "memory",
    };
  }

  async createSignedUpload(
    input: SignedUploadInput,
  ): Promise<SignedUploadGrant> {
    const expiresAt = new Date(Date.now() + input.expiresInSeconds * 1000);
    return {
      uploadUrl: `memory://upload/${encodeURIComponent(input.bucket)}/${encodeURIComponent(input.key)}`,
      method: "PUT",
      headers: { "Content-Type": input.contentType },
      expiresAt,
      key: input.key,
      bucket: input.bucket,
      provider: "memory",
      token: `memory-token-${input.key}`,
    };
  }

  async getMetadata(input: ObjectKeyInput): Promise<ObjectMetadata | null> {
    const record = this.objects.get(recordKey(input));
    if (!record) return null;
    return this.toMetadata(input, record);
  }

  /** Test helper: simulate a completed browser PUT. */
  async completeSignedUpload(
    input: PutObjectInput,
  ): Promise<StoredObject> {
    return this.put(input);
  }

  clear(): void {
    this.objects.clear();
  }

  private toMetadata(
    input: ObjectKeyInput,
    record: MemoryRecord,
  ): ObjectMetadata {
    return {
      key: input.key,
      bucket: input.bucket,
      provider: "memory",
      sizeBytes: record.data.byteLength,
      contentType: record.contentType,
      etag: record.etag,
      lastModified: record.createdAt,
    };
  }
}
