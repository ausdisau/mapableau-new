import type { JsonObject } from "../../types";

export function buildThingModel(
  id: string,
  properties: JsonObject,
): JsonObject {
  return { id, properties, actions: {}, events: {} };
}
