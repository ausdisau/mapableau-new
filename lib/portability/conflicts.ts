import type { PortableBundle } from "./validation";

export interface ImportConflict {
  path: string;
  reason: string;
  existing?: unknown;
  incoming?: unknown;
}

/**
 * Compare an incoming portable bundle to an existing snapshot and identify
 * conflicts a human must resolve. The participant decides how to resolve —
 * we never silently overwrite.
 */
export function detectImportConflicts(input: {
  incoming: PortableBundle;
  existing: PortableBundle | null;
}): ImportConflict[] {
  const conflicts: ImportConflict[] = [];
  if (!input.existing) return conflicts;

  const compare = (path: string, a: string[], b: string[]) => {
    for (const s of a) {
      if (!b.includes(s)) {
        conflicts.push({ path, reason: "not_present_in_incoming", existing: s });
      }
    }
    for (const s of b) {
      if (!a.includes(s)) {
        conflicts.push({ path, reason: "new_in_incoming", incoming: s });
      }
    }
  };
  compare(
    "functionalNeeds",
    input.existing.functionalNeeds,
    input.incoming.functionalNeeds
  );
  compare(
    "communicationPreferences",
    input.existing.communicationPreferences,
    input.incoming.communicationPreferences
  );
  compare(
    "environmentalNeeds",
    input.existing.environmentalNeeds,
    input.incoming.environmentalNeeds
  );
  return conflicts;
}
