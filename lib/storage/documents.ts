import { createHash } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import { phase2Config } from "@/lib/config/phase2";

const UPLOAD_ROOT = path.join(process.cwd(), ".data", "documents");

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "text/plain",
] as const;

type AllowedMime = (typeof ALLOWED_MIME_TYPES)[number];

/** Sniff MIME from content bytes; never trust the filename alone. */
export function sniffMimeType(buffer: Buffer): AllowedMime | "application/octet-stream" {
  if (buffer.length >= 4) {
    // %PDF
    if (
      buffer[0] === 0x25 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x44 &&
      buffer[3] === 0x46
    ) {
      return "application/pdf";
    }
    // PNG
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      return "image/png";
    }
    // JPEG
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return "image/jpeg";
    }
  }

  // UTF-8 / ASCII plain text — reject if high ratio of control bytes
  if (buffer.length > 0) {
    let control = 0;
    const sample = Math.min(buffer.length, 512);
    for (let i = 0; i < sample; i += 1) {
      const b = buffer[i]!;
      if (b === 0) {
        return "application/octet-stream";
      }
      if (b < 0x09 || (b > 0x0d && b < 0x20)) {
        control += 1;
      }
    }
    if (control / sample < 0.05) {
      return "text/plain";
    }
  }

  return "application/octet-stream";
}

export function validateUpload(
  mimeType: string,
  fileSize: number,
): string | null {
  const maxBytes = phase2Config.documentMaxUploadMb * 1024 * 1024;
  if (fileSize > maxBytes) {
    return `File must be under ${phase2Config.documentMaxUploadMb} MB`;
  }
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)) {
    return "File type not allowed";
  }
  return null;
}

/**
 * Validates size + sniffed MIME before any disk write.
 * Returns a validation error string, or null when the upload may proceed.
 */
export function validateUploadBuffer(buffer: Buffer): {
  error: string | null;
  mimeType: string;
  fileSize: number;
} {
  const fileSize = buffer.length;
  const mimeType = sniffMimeType(buffer);
  return {
    error: validateUpload(mimeType, fileSize),
    mimeType,
    fileSize,
  };
}

export async function storeDocumentFile(
  buffer: Buffer,
  originalName: string,
  mimeType?: string,
): Promise<{ fileKey: string; mimeType: string; fileSize: number }> {
  if (phase2Config.documentStorageMode !== "local") {
    throw new Error("Only local document storage is configured in Phase 2");
  }

  const resolvedMime = mimeType ?? sniffMimeType(buffer);
  const validation = validateUpload(resolvedMime, buffer.length);
  if (validation) {
    throw new Error(validation);
  }

  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const hash = createHash("sha256").update(buffer).digest("hex").slice(0, 16);
  const fileKey = `${hash}-${safeName}`;
  const dir = UPLOAD_ROOT;
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, fileKey), buffer);

  return {
    fileKey,
    mimeType: resolvedMime,
    fileSize: buffer.length,
  };
}

export async function readDocumentFile(fileKey: string): Promise<Buffer> {
  const safeKey = path.basename(fileKey);
  return readFile(path.join(UPLOAD_ROOT, safeKey));
}

/** @deprecated Prefer sniffMimeType — extension-only guessing is unsafe. */
export function guessMime(name: string): string {
  if (name.endsWith(".pdf")) return "application/pdf";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".txt")) return "text/plain";
  return "application/octet-stream";
}
