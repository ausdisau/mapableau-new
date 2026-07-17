import { createHash } from "node:crypto";

export function sha256Hex(input: string | Buffer): string {
  return createHash("sha256").update(input).digest("hex");
}

export function checksumEvidencePayload(payload: {
  title: string;
  evidenceType: string;
  summary?: string | null;
  documentId?: string | null;
  collectedAtIso: string;
}): string {
  const canonical = JSON.stringify({
    title: payload.title,
    evidenceType: payload.evidenceType,
    summary: payload.summary ?? null,
    documentId: payload.documentId ?? null,
    collectedAtIso: payload.collectedAtIso,
  });
  return sha256Hex(canonical);
}
