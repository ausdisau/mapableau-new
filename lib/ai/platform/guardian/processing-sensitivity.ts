import type { DataClass } from "@/lib/ai/platform/types/classification";
import { DATA_CLASSES } from "@/lib/ai/platform/types/classification";

import type { ProcessingSensitivity } from "./contracts";

const DATA_CLASS_SET = new Set<string>(DATA_CLASSES);

/**
 * Explicit, testable DataClass → ProcessingSensitivity mapping.
 * Do not replace canonical DataClass with D0–D4 as the primary enum.
 */
export const DATA_CLASS_TO_SENSITIVITY: Record<DataClass, ProcessingSensitivity> =
  {
    public: "D0_PUBLIC",
    operational: "D1_INTERNAL",
    participant_pii: "D2_PERSONAL",
    health_sensitive: "D3_SENSITIVE",
    safeguarding: "D3_SENSITIVE",
    financial: "D4_RESTRICTED",
    credentials_secrets: "D4_RESTRICTED",
    legal_privileged: "D4_RESTRICTED",
  };

const SENSITIVITY_RANK: Record<ProcessingSensitivity, number> = {
  D0_PUBLIC: 0,
  D1_INTERNAL: 1,
  D2_PERSONAL: 2,
  D3_SENSITIVE: 3,
  D4_RESTRICTED: 4,
};

/** Unknown / unclassified fails upward to more restrictive. */
export const UNKNOWN_SENSITIVITY: ProcessingSensitivity = "D4_RESTRICTED";

export function sensitivityForDataClass(
  dataClass: DataClass | string
): ProcessingSensitivity {
  if (!DATA_CLASS_SET.has(dataClass)) {
    return UNKNOWN_SENSITIVITY;
  }
  return DATA_CLASS_TO_SENSITIVITY[dataClass as DataClass];
}

export function maxSensitivity(
  classes: ReadonlyArray<DataClass | string>
): ProcessingSensitivity {
  if (classes.length === 0) {
    return UNKNOWN_SENSITIVITY;
  }
  let max: ProcessingSensitivity = "D0_PUBLIC";
  for (const dc of classes) {
    const s = sensitivityForDataClass(dc);
    if (SENSITIVITY_RANK[s] > SENSITIVITY_RANK[max]) {
      max = s;
    }
  }
  return max;
}

export function compareSensitivity(
  a: ProcessingSensitivity,
  b: ProcessingSensitivity
): number {
  return SENSITIVITY_RANK[a] - SENSITIVITY_RANK[b];
}

/** Never automatically downgrade; returns the more restrictive of the two. */
export function failUpward(
  current: ProcessingSensitivity,
  candidate: ProcessingSensitivity
): ProcessingSensitivity {
  return compareSensitivity(candidate, current) > 0 ? candidate : current;
}
