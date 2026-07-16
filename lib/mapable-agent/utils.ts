import { createHash } from "node:crypto";

/** Strip raw chain-of-thought; keep a short participant-safe summary only. */
export function extractReasoningSummary(raw: string | undefined): string | undefined {
  if (!raw?.trim()) return undefined;
  const cleaned = raw
    .replace(/<\|[^|]+\|>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return undefined;
  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean);
  return sentences.slice(0, 2).join(" ").slice(0, 280);
}

export function hashToolInput(input: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(input ?? {}))
    .digest("hex")
    .slice(0, 16);
}

export function toPlainLanguage(text: string): string {
  return text
    .replace(/\b[A-Z_]{3,}\b/g, (m) => m.toLowerCase().replace(/_/g, " "))
    .trim();
}
