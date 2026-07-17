import { createHash } from "crypto";

export function duplicateKey(parts: string[]): string {
  return createHash("sha256").update(parts.join("|"), "utf8").digest("hex");
}
