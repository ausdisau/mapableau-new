import { createHash, randomBytes } from "crypto";

import type { OpaqueToken } from "../types";

export function createCheckpointToken(
  checkpointId: string,
  expiresAt: Date,
): OpaqueToken {
  const token = `chk_${randomBytes(16).toString("base64url")}`;
  const checksum = createHash("sha256")
    .update(`${checkpointId}:${token}:${expiresAt.toISOString()}`)
    .digest("hex");
  return { token, expiresAt, checksum };
}
