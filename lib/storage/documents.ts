import { createHash } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import { isDocumentObjectStoreEnabled } from "@/lib/config/object-storage";
import { phase2Config } from "@/lib/config/phase2";

import {
  parseObjectStoreDocumentAssetId,
  readCareDocumentFromObjectStore,
  storeCareDocumentOnObjectStore,
  type StoreDocumentOwnerContext,
  type StoredDocumentFile,
} from "./document-object-store";

const UPLOAD_ROOT = path.join(process.cwd(), ".data", "documents");

export type { StoreDocumentOwnerContext, StoredDocumentFile };

function resolveDocumentStorageMode(): "local" | "object_store" {
  if (isDocumentObjectStoreEnabled()) return "object_store";
  const mode = (process.env.DOCUMENT_STORAGE_MODE ?? "local").trim().toLowerCase();
  if (mode !== "local") {
    throw new Error("Only local document storage is configured in Phase 2");
  }
  return "local";
}

export async function storeDocumentFile(
  buffer: Buffer,
  originalName: string,
  context?: StoreDocumentOwnerContext,
): Promise<StoredDocumentFile> {
  if (resolveDocumentStorageMode() === "object_store") {
    if (!context?.uploadedById) {
      throw new Error("Object-store document writes require an uploading user");
    }
    return storeCareDocumentOnObjectStore({
      ...context,
      buffer,
      originalName,
    });
  }

  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const hash = createHash("sha256").update(buffer).digest("hex").slice(0, 16);
  const fileKey = `${hash}-${safeName}`;
  const dir = UPLOAD_ROOT;
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, fileKey), buffer);

  return {
    fileKey,
    mimeType: guessMime(safeName),
    fileSize: buffer.length,
  };
}

export async function readDocumentFile(fileKey: string): Promise<Buffer> {
  const assetId = parseObjectStoreDocumentAssetId(fileKey);
  if (assetId) {
    return readCareDocumentFromObjectStore(assetId);
  }
  const safeKey = path.basename(fileKey);
  return readFile(path.join(UPLOAD_ROOT, safeKey));
}

function guessMime(name: string): string {
  if (name.endsWith(".pdf")) return "application/pdf";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".txt")) return "text/plain";
  return "application/octet-stream";
}

export function guessDocumentMime(originalName: string): string {
  return guessMime(originalName.replace(/[^a-zA-Z0-9._-]/g, "_"));
}

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "text/plain",
];

export function validateUpload(
  mimeType: string,
  fileSize: number,
): string | null {
  const maxBytes = phase2Config.documentMaxUploadMb * 1024 * 1024;
  if (fileSize > maxBytes) {
    return `File must be under ${phase2Config.documentMaxUploadMb} MB`;
  }
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return "File type not allowed";
  }
  return null;
}
