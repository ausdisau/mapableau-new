import { createHash } from "crypto";

/**
 * Canonicalise a publication package for tamper-evident checksums.
 * Keys are sorted recursively; undefined values omitted.
 */
export function canonicalisePublicationPackage(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (value === null || typeof value !== "object") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }
  const record = value as Record<string, unknown>;
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(record).sort()) {
    const entry = record[key];
    if (entry !== undefined) {
      sorted[key] = sortValue(entry);
    }
  }
  return sorted;
}

export function hashPublicationPackage(value: unknown): string {
  const canonical = canonicalisePublicationPackage(value);
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

export function verifyPublicationChecksum(
  value: unknown,
  expectedSha256: string
): boolean {
  if (!expectedSha256) return false;
  return hashPublicationPackage(value) === expectedSha256.toLowerCase();
}
