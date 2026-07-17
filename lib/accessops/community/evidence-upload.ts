import { createHash } from "crypto";

export function evidenceUploadChecksum(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}
