import { contextFabricConfig } from "@/lib/config/context-fabric";

import { refreshRecordFreshness } from "./freshness";
import { evaluateRecordAuthorisation } from "./scope";
import { listContextRecordsForTenant } from "./store";
import type {
  ContextType,
  MapAbleContextRecord,
  MissionContextQuery,
  MissionContextQueryResult,
} from "./types";

/**
 * Mission-scoped context query.
 * Returns only authorised, consent-satisfying, mission/participant-linked slices.
 * Never returns a complete participant record dump.
 */
export function queryMissionContext(
  query: MissionContextQuery,
): MissionContextQueryResult {
  const queriedAt = new Date().toISOString();

  if (!contextFabricConfig.enabled) {
    return {
      records: [],
      excludedCount: 0,
      exclusionReasons: ["context_fabric_disabled"],
      unknownTypes: [],
      missingTypes: query.requestedContextTypes ?? [],
      queriedAt,
      fabricEnabled: false,
    };
  }

  const all = listContextRecordsForTenant(query.tenantId).map((r) =>
    refreshRecordFreshness(r),
  );

  const requested = query.requestedContextTypes;
  const candidates = requested?.length
    ? all.filter((r) => requested.includes(r.contextType))
    : all;

  const records: MapAbleContextRecord[] = [];
  const exclusionReasons: string[] = [];
  let excludedCount = 0;

  for (const record of candidates) {
    const auth = evaluateRecordAuthorisation({ record, query });
    if (!auth.authorised) {
      excludedCount += 1;
      if (auth.reason) exclusionReasons.push(`${record.contextId}:${auth.reason}`);
      continue;
    }
    records.push(sanitiseForQuery(record));
  }

  const presentTypes = new Set(records.map((r) => r.contextType));
  const requestedSet = requested ?? [];
  const missingTypes: ContextType[] = [];
  const unknownTypes: ContextType[] = [];

  for (const t of requestedSet) {
    if (presentTypes.has(t)) continue;
    const hadUnknownAge = candidates.some(
      (c) => c.contextType === t && c.freshnessStatus === "unknown",
    );
    if (hadUnknownAge) {
      unknownTypes.push(t);
    } else {
      missingTypes.push(t);
    }
  }

  return {
    records,
    excludedCount,
    exclusionReasons,
    unknownTypes,
    missingTypes,
    queriedAt,
    fabricEnabled: true,
  };
}

function sanitiseForQuery(record: MapAbleContextRecord): MapAbleContextRecord {
  const { payload, ...rest } = record;
  return {
    ...rest,
    payload: { ...payload },
  };
}
