import { listMemoryItems } from "./store";
import type { AgencyMemoryCategory, MapAbleAgencyMemoryItem , MemoryConflict } from "./types";

/**
 * Conflict handling: do not silently choose when semantics are unclear.
 * Prefer most recent explicit instruction when it clearly supersedes;
 * otherwise surface conflict / ask participant.
 */

function sameSemanticKey(a: MapAbleAgencyMemoryItem, b: MapAbleAgencyMemoryItem): boolean {
  if (a.category !== b.category) return false;
  if (a.purpose || b.purpose) {
    return a.purpose === b.purpose;
  }
  const aKey =
    typeof a.structuredValue === "object" &&
    a.structuredValue !== null &&
    "key" in a.structuredValue
      ? String((a.structuredValue as { key: unknown }).key)
      : null;
  const bKey =
    typeof b.structuredValue === "object" &&
    b.structuredValue !== null &&
    "key" in b.structuredValue
      ? String((b.structuredValue as { key: unknown }).key)
      : null;
  if (aKey && bKey) return aKey === bKey;
  return a.statement.trim().toLowerCase() === b.statement.trim().toLowerCase();
}

function clearlySupersedes(
  newer: MapAbleAgencyMemoryItem,
  older: MapAbleAgencyMemoryItem,
): boolean {
  if (newer.supersedes === older.memoryId) return true;
  if (
    typeof newer.structuredValue === "object" &&
    newer.structuredValue !== null &&
    "key" in newer.structuredValue &&
    typeof older.structuredValue === "object" &&
    older.structuredValue !== null &&
    "key" in older.structuredValue
  ) {
    const nk = String((newer.structuredValue as { key: unknown }).key);
    const ok = String((older.structuredValue as { key: unknown }).key);
    return nk === ok && newer.effectiveFrom >= older.effectiveFrom;
  }
  return false;
}

export function detectConflicts(params: {
  participantId: string;
  tenantId: string;
  category?: AgencyMemoryCategory;
}): MemoryConflict[] {
  const items = listMemoryItems(params).filter(
    (m) =>
      m.confirmationState === "confirmed" &&
      (!params.category || m.category === params.category),
  );

  const conflicts: MemoryConflict[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i]!;
      const b = items[j]!;
      if (!sameSemanticKey(a, b)) continue;
      const pairKey = [a.memoryId, b.memoryId].sort().join(":");
      if (seen.has(pairKey)) continue;
      seen.add(pairKey);

      const [newer, older] =
        a.effectiveFrom >= b.effectiveFrom ? [a, b] : [b, a];

      if (clearlySupersedes(newer, older)) {
        conflicts.push({
          conflictId: `conflict-${pairKey}`,
          participantId: params.participantId,
          category: a.category,
          memoryIds: [a.memoryId, b.memoryId],
          reason: "Superseding instruction present",
          resolution: "most_recent_supersedes",
          explanation:
            "A newer confirmed instruction clearly replaces the older one.",
        });
      } else {
        conflicts.push({
          conflictId: `conflict-${pairKey}`,
          participantId: params.participantId,
          category: a.category,
          memoryIds: [a.memoryId, b.memoryId],
          reason: "Conflicting confirmed preferences",
          resolution: "ask_participant",
          explanation:
            "Two confirmed preferences overlap and MapAble will not choose silently. Please confirm which one to keep.",
        });
      }
    }
  }

  return conflicts;
}

export function resolveConflictPreferringRecent(conflict: MemoryConflict): {
  keepMemoryId: string | null;
  needsParticipant: boolean;
} {
  if (conflict.resolution === "ask_participant") {
    return { keepMemoryId: null, needsParticipant: true };
  }
  if (conflict.resolution === "most_recent_supersedes") {
    return {
      keepMemoryId: conflict.memoryIds[0] ?? null,
      needsParticipant: false,
    };
  }
  return { keepMemoryId: null, needsParticipant: true };
}
