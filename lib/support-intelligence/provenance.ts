import { createHash } from "node:crypto";

import type { Provenance } from "@/lib/support-intelligence/types";

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

export function buildProvenance(input: {
  sourceKind: Provenance["sourceKind"];
  sourceUrl: string;
  raw: unknown;
  licenseAndReuse?: string;
  effectiveAt?: string;
  validUntil?: string;
  retrievedAt?: string;
}): Provenance {
  const serialised =
    typeof input.raw === "string" ? input.raw : JSON.stringify(input.raw);
  return {
    sourceKind: input.sourceKind,
    sourceUrl: input.sourceUrl,
    retrievedAt: input.retrievedAt ?? new Date().toISOString(),
    effectiveAt: input.effectiveAt,
    rawHash: sha256Hex(serialised),
    licenseAndReuse: input.licenseAndReuse,
    validUntil: input.validUntil,
  };
}

export function isStale(
  provenance: Provenance,
  now = new Date(),
): boolean {
  if (!provenance.validUntil) return false;
  return new Date(provenance.validUntil).getTime() < now.getTime();
}
