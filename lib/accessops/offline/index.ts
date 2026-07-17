import { createHash } from "crypto";

import type { JsonObject } from "../types";

export function checksumOfflinePack(payload: JsonObject): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export function buildOfflinePack(
  payload: JsonObject,
  expiresAt: Date,
): JsonObject {
  return {
    payload,
    expiresAt: expiresAt.toISOString(),
    checksum: checksumOfflinePack(payload),
  };
}
