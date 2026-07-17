import { createHash } from "node:crypto";

export function buildPilotIdempotencyKey(parts: {
  pilotId: string;
  operation: string;
  subjectId: string;
  amountCents?: number;
  nonce?: string;
}): string {
  const raw = [
    parts.pilotId,
    parts.operation,
    parts.subjectId,
    parts.amountCents?.toString() ?? "0",
    parts.nonce ?? "",
  ].join("|");
  return createHash("sha256").update(raw).digest("hex");
}
