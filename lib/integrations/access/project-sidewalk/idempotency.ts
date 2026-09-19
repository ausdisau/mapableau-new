/**
 * Stable source identity for Project Sidewalk imports — prevents duplicate logical observations.
 */

import { createHash } from "crypto";

import type { NormalizedObservation } from "../contracts";
import { mapProjectSidewalkLabel } from "./mapper";

const importedSourceKeys = new Set<string>();

export function projectSidewalkSourceKey(labelId: string | number): string {
  return `project_sidewalk:${String(labelId)}`;
}

export function __resetProjectSidewalkImportCacheForTests(): void {
  importedSourceKeys.clear();
}

export type SidewalkImportResult =
  | { status: "imported"; observation: NormalizedObservation; sourceKey: string }
  | { status: "duplicate"; sourceKey: string; observation: NormalizedObservation };

/**
 * Normalise + idempotent import gate. Does not write Prisma.
 * Replay of the same label_id returns duplicate without creating a new logical observation.
 */
export function importProjectSidewalkLabel(
  raw: unknown,
): SidewalkImportResult {
  const observation = mapProjectSidewalkLabel(raw);
  const sourceKey =
    observation.provenance.sourceReference != null
      ? projectSidewalkSourceKey(observation.provenance.sourceReference)
      : `project_sidewalk:hash:${createHash("sha256")
          .update(JSON.stringify(raw))
          .digest("hex")
          .slice(0, 16)}`;

  if (importedSourceKeys.has(sourceKey)) {
    return { status: "duplicate", sourceKey, observation };
  }
  importedSourceKeys.add(sourceKey);
  return { status: "imported", sourceKey, observation };
}
