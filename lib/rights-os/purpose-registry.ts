import purposesSeed from "@/data/rights-os/purposes.v1.json";
import type { PurposeDefinition, RightsDataOperation } from "@/lib/rights-os/types";

const PROHIBITED_VAGUE = new Set(purposesSeed.prohibitedVaguePurposes);

let cachedPurposes: Map<string, PurposeDefinition> | null = null;

function loadPurposes(): Map<string, PurposeDefinition> {
  if (cachedPurposes) return cachedPurposes;
  cachedPurposes = new Map();
  for (const p of purposesSeed.purposes) {
    cachedPurposes.set(p.code, {
      ...p,
      allowedOperations: (p.allowedOperations ?? ["read"]) as RightsDataOperation[],
      allowedRequesters: p.allowedRequesters ?? [],
      allowedRecipients: p.allowedRecipients ?? [],
      allowedFields: p.allowedFields ?? [],
      prohibitedFields: p.prohibitedFields ?? [],
    });
  }
  return cachedPurposes;
}

export const PURPOSE_REGISTRY_VERSION = purposesSeed.version;

export function getPurpose(code: string): PurposeDefinition | undefined {
  return loadPurposes().get(code);
}

export function listPurposes(): PurposeDefinition[] {
  return Array.from(loadPurposes().values());
}

export function isVaguePurpose(code: string): boolean {
  return PROHIBITED_VAGUE.has(code);
}

export function isRegisteredPurpose(code: string): boolean {
  return loadPurposes().has(code);
}

export function validatePurposeCode(code: string): {
  valid: boolean;
  reason?: string;
} {
  if (!code || code.trim() === "") {
    return { valid: false, reason: "PURPOSE_MISSING" };
  }
  if (isVaguePurpose(code)) {
    return { valid: false, reason: "PURPOSE_VAGUE" };
  }
  if (!isRegisteredPurpose(code)) {
    return { valid: false, reason: "PURPOSE_UNREGISTERED" };
  }
  return { valid: true };
}
