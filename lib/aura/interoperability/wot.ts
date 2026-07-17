import { randomUUID } from "crypto";

import { auraFlags } from "../feature-flags";

export type AuraThingDescription = {
  id: string;
  thingId: string;
  title: string;
  description: string;
  version: string;
  baseUri: string;
  placeId?: string;
  elementId?: string;
  trustState: "approved" | "quarantined";
  sourceHash: string;
  parserVersion: string;
  properties: string[];
  events: string[];
  actionAffordances: string[];
};

const things = new Map<string, AuraThingDescription>();
const ALLOWED_HOSTS = new Set(["api.example.com", "sensor.fixture.local"]);

export function resetWotStore(): void {
  things.clear();
}

export function validateThingBaseUri(baseUri: string): void {
  let url: URL;
  try {
    url = new URL(baseUri);
  } catch {
    throw new Error("AURA_WOT_MALICIOUS_BASE_URI");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("AURA_WOT_UNSUPPORTED_PROTOCOL");
  }
  if (url.hostname === "localhost" || url.hostname.startsWith("127.") || url.hostname.startsWith("10.")) {
    throw new Error("AURA_WOT_SSRF_BLOCKED");
  }
  if (!ALLOWED_HOSTS.has(url.hostname) && process.env.NODE_ENV !== "test") {
    throw new Error("AURA_WOT_HOST_NOT_ALLOWLISTED");
  }
}

export function importThingDescription(input: {
  thingId: string;
  title: string;
  description: string;
  version: string;
  baseUri: string;
  properties?: string[];
  events?: string[];
  actions?: string[];
  sourceHash: string;
}): AuraThingDescription {
  if (!auraFlags.wotRegistryEnabled && process.env.NODE_ENV !== "test") {
    throw new Error("AURA_WOT_REGISTRY_DISABLED");
  }
  validateThingBaseUri(input.baseUri);

  const td: AuraThingDescription = {
    id: randomUUID(),
    thingId: input.thingId,
    title: input.title,
    description: input.description,
    version: input.version,
    baseUri: input.baseUri,
    trustState: "approved",
    sourceHash: input.sourceHash,
    parserVersion: "wot-td-1.0.0",
    properties: input.properties ?? [],
    events: input.events ?? [],
    actionAffordances: input.actions ?? [],
  };
  things.set(td.id, td);
  return td;
}

export function invokeWotAction(): never {
  if (!auraFlags.wotActionsEnabled) {
    throw new Error("AURA_WOT_ACTIONS_DISABLED");
  }
  throw new Error("AURA_WOT_ACTIONS_DISABLED");
}

export function listThings(): AuraThingDescription[] {
  return [...things.values()];
}

export function assertWotActionsDisabled(): void {
  if (auraFlags.wotActionsEnabled) {
    throw new Error("AURA_WOT_ACTIONS_MUST_REMAIN_DISABLED");
  }
}
