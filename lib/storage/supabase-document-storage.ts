import { createHash } from "crypto";
import path from "path";

import { requireSupabaseStorageBucket } from "@/lib/supabase/config";
import { createSupabaseServiceClient } from "@/lib/supabase/server-client";

export async function storeSupabaseDocumentFile(
  buffer: Buffer,
  originalName: string,
  contentType: string,
): Promise<{ fileKey: string; mimeType: string; fileSize: number }> {
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const hash = createHash("sha256").update(buffer).digest("hex").slice(0, 16);
  const fileKey = `${new Date().toISOString().slice(0, 10)}/${hash}-${safeName}`;
  const bucket = requireSupabaseStorageBucket();

  const { error } = await createSupabaseServiceClient()
    .storage.from(bucket)
    .upload(fileKey, buffer, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Supabase document upload failed: ${error.message}`);
  }

  return {
    fileKey,
    mimeType: contentType,
    fileSize: buffer.length,
  };
}

export async function readSupabaseDocumentFile(
  fileKey: string,
): Promise<Buffer> {
  const bucket = requireSupabaseStorageBucket();
  const safeKey = fileKey
    .split("/")
    .map((part) => path.basename(part))
    .filter(Boolean)
    .join("/");

  const { data, error } = await createSupabaseServiceClient()
    .storage.from(bucket)
    .download(safeKey);

  if (error) {
    throw new Error(`Supabase document download failed: ${error.message}`);
  }
  if (!data) {
    throw new Error("Supabase document download returned no data");
  }

  return Buffer.from(await data.arrayBuffer());
}
