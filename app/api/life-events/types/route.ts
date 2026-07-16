import { jsonError, jsonOk } from "@/lib/api/response";
import { isLifeEventsEnabled } from "@/lib/continuity-os/config";
import {
  getLifeEventRegistryMeta,
  listLifeEventTypes,
} from "@/lib/continuity-os/taxonomy";

export async function GET() {
  if (!isLifeEventsEnabled()) {
    return jsonError("Life events are disabled", 404);
  }

  const types = listLifeEventTypes().map((t) => ({
    typeKey: t.typeKey,
    category: t.category,
    version: t.version,
    plainLanguageDescription: t.plainLanguageDescription,
    domainsInvolved: t.domainsInvolved,
    requiredWarnings: t.requiredWarnings,
    prohibitedAutomatedDecisions: t.prohibitedAutomatedDecisions,
    reviewOwner: t.reviewOwner,
  }));

  return jsonOk({
    meta: getLifeEventRegistryMeta(),
    types,
  });
}
