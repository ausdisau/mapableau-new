import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

import { storeDocumentFile } from "@/lib/storage/documents";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads", "access");

function useS3Storage(): boolean {
  const mode = process.env.DOCUMENT_STORAGE_BACKEND ?? "local";
  return mode === "s3" || mode === "supabase";
}

export async function saveAccessMediaFile(params: {
  buffer: Buffer;
  mimeType: string;
  prefix: "reviews" | "accreditation" | "venue" | "alerts";
  originalName?: string;
}): Promise<string> {
  if (useS3Storage()) {
    const stored = await storeDocumentFile(
      params.buffer,
      params.originalName ?? `${params.prefix}-${randomUUID()}.jpg`
    );
    return stored.fileKey;
  }

  const ext =
    params.mimeType === "image/png"
      ? ".png"
      : params.mimeType === "image/webp"
        ? ".webp"
        : ".jpg";
  const dir = path.join(UPLOAD_ROOT, params.prefix);
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}${ext}`;
  const full = path.join(dir, name);
  await writeFile(full, params.buffer);
  return path.relative(process.cwd(), full);
}
