import type { JsonObject } from "../../types";

export function mapReadOnlyAffordances(thing: JsonObject): string[] {
  const properties = thing.properties;
  if (
    !properties ||
    typeof properties !== "object" ||
    Array.isArray(properties)
  )
    return [];
  return Object.keys(properties);
}

export function areWoTActionsEnabled(): false {
  return false;
}
