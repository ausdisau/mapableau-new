import { getSupabaseAdmin } from "@/lib/supabase/admin";

import {
  ObjectNotFoundError,
  StorageConfigurationError,
  StorageProviderError,
} from "../errors";
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

type SupabaseAdmin = ReturnType<typeof getSupabaseAdmin>;

function redactProviderMessage(message: string): string {
  return message.replace(
    /(?:service[_-]?role|secret|apikey|Bearer\s+\S+)/gi,
    "[redacted]",
  );
}

/**
 * Supabase Storage adapter. Uses the existing server-only admin client.
 * Never import this module from client components.
 */
export class SupabaseObjectStore implements ObjectStore {
  readonly provider = "supabase" as const;
  private readonly clientFactory: () => SupabaseAdmin;

  constructor(
    clientFactory: () => SupabaseAdmin = getSupabaseAdmin,
  ) {
    this.clientFactory = clientFactory;
  }

  async put(input: PutObjectInput): Promise<StoredObject> {
    const supabase = this.client();
    const { data, error } = await supabase.storage
      .from(input.bucket)
      .upload(input.key, input.data, {
        contentType: input.contentType,
        upsert: true,
        cacheControl: input.cacheControl,
      });
    if (error) {
      throw this.wrap(error.message);
    }
    return {
      key: data?.path ?? input.key,
      bucket: input.bucket,
      provider: "supabase",
      sizeBytes: input.data.byteLength,
      contentType: input.contentType,
      createdAt: new Date(),
    };
  }

  async get(input: GetObjectInput): Promise<StoredObjectStream> {
    const supabase = this.client();
    const { data, error } = await supabase.storage
      .from(input.bucket)
      .download(input.key);
    if (error || !data) {
      throw this.notFoundOrWrap(error?.message);
    }
    const body = new Uint8Array(await data.arrayBuffer());
    const metadata = (await this.getMetadata(input)) ?? {
      key: input.key,
      bucket: input.bucket,
      provider: "supabase" as const,
      sizeBytes: body.byteLength,
      contentType: data.type || "application/octet-stream",
    };
    return { body, metadata };
  }

  async remove(input: RemoveObjectInput): Promise<void> {
    const supabase = this.client();
    const { error } = await supabase.storage
      .from(input.bucket)
      .remove([input.key]);
    if (error) throw this.wrap(error.message);
  }

  async exists(input: ObjectKeyInput): Promise<boolean> {
    const metadata = await this.getMetadata(input);
    return metadata != null;
  }

  async createSignedReadUrl(input: SignedReadInput): Promise<SignedObjectUrl> {
    if (input.expiresInSeconds < 1 || input.expiresInSeconds > 900) {
      throw new StorageProviderError("Signed URL expiry is invalid");
    }
    const supabase = this.client();
    const { data, error } = await supabase.storage
      .from(input.bucket)
      .createSignedUrl(input.key, input.expiresInSeconds);
    if (error || !data?.signedUrl) {
      throw this.notFoundOrWrap(error?.message ?? "SIGNED_URL_FAILED");
    }
    return {
      url: data.signedUrl,
      expiresAt: new Date(Date.now() + input.expiresInSeconds * 1000),
      key: input.key,
      bucket: input.bucket,
      provider: "supabase",
    };
  }

  async createSignedUpload(
    input: SignedUploadInput,
  ): Promise<SignedUploadGrant> {
    if (input.expiresInSeconds < 1 || input.expiresInSeconds > 900) {
      throw new StorageProviderError("Signed upload expiry is invalid");
    }
    const supabase = this.client();
    const { data, error } = await supabase.storage
      .from(input.bucket)
      .createSignedUploadUrl(input.key);
    if (error || !data?.signedUrl) {
      throw this.wrap(error?.message ?? "SIGNED_UPLOAD_FAILED");
    }
    return {
      uploadUrl: data.signedUrl,
      method: "PUT",
      headers: { "Content-Type": input.contentType },
      expiresAt: new Date(Date.now() + input.expiresInSeconds * 1000),
      key: data.path ?? input.key,
      bucket: input.bucket,
      provider: "supabase",
      token: data.token,
    };
  }

  async getMetadata(input: ObjectKeyInput): Promise<ObjectMetadata | null> {
    const supabase = this.client();
    const slash = input.key.lastIndexOf("/");
    const folder = slash >= 0 ? input.key.slice(0, slash) : "";
    const filename = slash >= 0 ? input.key.slice(slash + 1) : input.key;
    const { data, error } = await supabase.storage
      .from(input.bucket)
      .list(folder, { search: filename, limit: 100 });
    if (error) {
      throw this.wrap(error.message);
    }
    const match = (data ?? []).find((entry) => entry.name === filename);
    if (!match) return null;
    const size =
      typeof match.metadata?.size === "number"
        ? match.metadata.size
        : Number(match.metadata?.size ?? 0);
    const contentType =
      typeof match.metadata?.mimetype === "string"
        ? match.metadata.mimetype
        : "application/octet-stream";
    return {
      key: input.key,
      bucket: input.bucket,
      provider: "supabase",
      sizeBytes: Number.isFinite(size) ? size : 0,
      contentType,
      etag: typeof match.metadata?.eTag === "string" ? match.metadata.eTag : undefined,
      lastModified: match.updated_at ? new Date(match.updated_at) : undefined,
    };
  }

  private client(): SupabaseAdmin {
    try {
      return this.clientFactory();
    } catch {
      throw new StorageConfigurationError(
        "Supabase admin client is not configured",
      );
    }
  }

  private wrap(message: string): StorageProviderError {
    return new StorageProviderError(redactProviderMessage(message));
  }

  private notFoundOrWrap(message?: string): StorageProviderError | ObjectNotFoundError {
    const lower = (message ?? "").toLowerCase();
    if (
      !message ||
      lower.includes("not found") ||
      lower.includes("404") ||
      lower.includes("object not found")
    ) {
      return new ObjectNotFoundError();
    }
    return this.wrap(message);
  }
}
