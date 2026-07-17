import { isAccessOpsFeatureEnabled } from "../feature-flags";
import type { JsonObject } from "../types";

import { filterOpenDataRecord } from "./privacy-filter";

export function exportOpenData(
  records: JsonObject[],
  env: Record<string, string | undefined> = process.env,
): JsonObject[] {
  if (!isAccessOpsFeatureEnabled("ACCESSOPS_OPEN_DATA_EXPORTS_ENABLED", env))
    return [];
  return records.flatMap((record) => {
    const filtered = filterOpenDataRecord(record);
    return filtered ? [filtered] : [];
  });
}
