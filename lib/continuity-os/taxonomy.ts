import registry from "@/data/continuity-os/life-event-types.v1.json";
import type { LifeEventTypeDefinition } from "@/lib/continuity-os/types";

const types = registry.types as LifeEventTypeDefinition[];

export function getLifeEventRegistryMeta() {
  return {
    registryVersion: registry.registryVersion,
    effectiveDate: registry.effectiveDate,
    typeCount: types.length,
  };
}

export function listLifeEventTypes(options?: {
  includeSuperseded?: boolean;
}): LifeEventTypeDefinition[] {
  const includeSuperseded = options?.includeSuperseded ?? false;
  return types.filter((t) => includeSuperseded || !t.supersededBy);
}

export function getLifeEventType(
  typeKey: string,
  version?: string
): LifeEventTypeDefinition | null {
  const matches = types.filter((t) => t.typeKey === typeKey);
  if (matches.length === 0) return null;
  if (version) {
    return matches.find((t) => t.version === version) ?? null;
  }
  const active = matches.find((t) => !t.supersededBy);
  return active ?? matches[matches.length - 1] ?? null;
}

export function assertSupportedLifeEventType(typeKey: string): LifeEventTypeDefinition {
  const def = getLifeEventType(typeKey);
  if (!def) {
    throw new Error(`Unsupported life event type: ${typeKey}`);
  }
  if (def.supersededBy) {
    throw new Error(
      `Life event type ${typeKey} is superseded by ${def.supersededBy}`
    );
  }
  return def;
}
