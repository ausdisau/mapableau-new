import { createHash } from "crypto";

import type { JsonObject } from "../types";

export function openDataVersion(records: JsonObject[]): string {
  return createHash("sha256").update(JSON.stringify(records)).digest("hex");
}
