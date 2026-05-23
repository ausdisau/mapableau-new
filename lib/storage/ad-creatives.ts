import { createHash } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import { phase2Config } from "@/lib/config/phase2";

const UPLOAD_ROOT = path.join(process.cwd(), ".data", "ad-creatives");

export const AD_CREATIVE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export async function storeAdCreativeFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<{ fileKey: string; mimeType: string; fileSize: number }> {
  if (!AD_CREATIVE_MIME_TYPES.includes(mimeType as (typeof AD_CREATIVE_MIME_TYPES)[number])) {
    throw new Error("Unsupported image type for ad creative");
  }

  const maxBytes = phase2Config.documentMaxUploadMb * 1024 * 1024;
  if (buffer.length > maxBytes) {
    throw new Error(`File exceeds ${phase2Config.documentMaxUploadMb}MB limit`);
  }

  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const hash = createHash("sha256").update(buffer).digest("hex").slice(0, 16);
  const fileKey = `ad-${hash}-${safeName}`;
  await mkdir(UPLOAD_ROOT, { recursive: true });
  await writeFile(path.join(UPLOAD_ROOT, fileKey), buffer);

  return { fileKey, mimeType, fileSize: buffer.length };
}

export async function readAdCreativeFile(fileKey: string): Promise<Buffer> {
  const safeKey = path.basename(fileKey);
  return readFile(path.join(UPLOAD_ROOT, safeKey));
}

export function adCreativePublicUrl(fileKey: string): string {
  return `/api/ads/creatives/file/${encodeURIComponent(fileKey)}`;
}
