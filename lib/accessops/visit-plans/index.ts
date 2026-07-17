import { createHash } from "crypto";

export function checksumVisitPlan(assetIds: string[]): string {
  return createHash("sha256").update(assetIds.join("|"), "utf8").digest("hex");
}

export function buildVisitPlan(
  assetIds: string[],
  expiresAt: Date,
): { assetIds: string[]; expiresAt: Date; checksum: string } {
  return { assetIds, expiresAt, checksum: checksumVisitPlan(assetIds) };
}
