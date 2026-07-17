import type { JsonObject } from "../../types";

export const WOT_THING_DESCRIPTION_PROFILE = "W3C WoT Thing Description 1.1";

export function parseThingDescription(document: JsonObject): {
  id: string;
  title: string;
  profile: string;
} {
  return {
    id: String(document.id ?? ""),
    title: String(document.title ?? "Untitled Thing"),
    profile: WOT_THING_DESCRIPTION_PROFILE,
  };
}
