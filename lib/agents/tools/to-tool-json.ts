import type { JSONValue } from "@strands-agents/sdk";

/** Serialize tool results for Strands JSONValue contract. */
export function toToolJson<T>(value: T): JSONValue {
  return JSON.parse(JSON.stringify(value)) as JSONValue;
}
