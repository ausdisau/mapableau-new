import { withContinuityHandler, disabledIf } from "@/lib/continuity-os/api";
import { isLifeEventsEnabled } from "@/lib/continuity-os/feature-flags";
import { listLifeEventTypes } from "@/lib/continuity-os/taxonomy/registry";
import { LIFE_EVENT_REGISTRY_VERSION } from "@/lib/continuity-os/taxonomy/registry";

export const GET = withContinuityHandler(async () => {
  const disabled = disabledIf(isLifeEventsEnabled(), "LIFE_EVENTS_DISABLED");
  if (disabled) return disabled;

  return Response.json({
    registryVersion: LIFE_EVENT_REGISTRY_VERSION,
    types: listLifeEventTypes(),
  });
});
