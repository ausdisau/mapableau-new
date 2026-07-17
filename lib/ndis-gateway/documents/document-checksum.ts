import { createHash } from "node:crypto";

/** Stable SHA-256 checksum of document content (UTF-8). */
export function checksumDocumentContent(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

export function checksumJson(value: unknown): string {
  return checksumDocumentContent(JSON.stringify(value));
}
