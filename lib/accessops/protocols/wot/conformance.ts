import type { ConformanceResult, JsonObject } from "../../types";

import { WOT_THING_DESCRIPTION_PROFILE } from "./thing-description";

export function validateWoTConformance(
  document: JsonObject,
): ConformanceResult {
  const errors: string[] = [];
  if (document.actions && Object.keys(document.actions).length > 0)
    errors.push("actions_disabled");
  return {
    conformant: errors.length === 0,
    profile: WOT_THING_DESCRIPTION_PROFILE,
    errors,
    warnings: [],
  };
}
