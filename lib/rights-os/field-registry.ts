import fieldsSeed from "@/data/rights-os/fields.v1.json";
import type { FieldDefinition } from "@/lib/rights-os/types";

let cachedFields: Map<string, FieldDefinition> | null = null;

function loadFields(): Map<string, FieldDefinition> {
  if (cachedFields) return cachedFields;
  cachedFields = new Map();
  for (const f of fieldsSeed.fields) {
    cachedFields.set(f.path, f);
  }
  return cachedFields;
}

export const FIELD_REGISTRY_VERSION = fieldsSeed.version;

export function getField(path: string): FieldDefinition | undefined {
  return loadFields().get(path);
}

export function listFields(): FieldDefinition[] {
  return Array.from(loadFields().values());
}

export function listFieldsByDomain(domain: string): FieldDefinition[] {
  return listFields().filter((f) => f.domain === domain);
}
