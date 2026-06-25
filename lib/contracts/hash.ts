import { createHash } from "node:crypto";

export function hashEvidence(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function hashEvidenceObject(value: unknown): string {
  return hashEvidence(JSON.stringify(value));
}
