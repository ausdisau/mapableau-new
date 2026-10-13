import { randomUUID } from "node:crypto";

import { retrieveScopedMemory } from "@/lib/ai/platform/agency-memory";
import {
  isAgencyMemoryEnabled,
  isAgencyMemoryModelContextEnabled,
} from "@/lib/config/agency-memory";
import { isContextFabricEnabled } from "@/lib/config/context-fabric";

import type { MapAbleContextRecord } from "./types";

/**
 * Project confirmed Agency Memory into Context Fabric preference records.
 * Minimum relevant only — never the full graph.
 */
export function agencyMemoryToContextRecords(params: {
  participantId: string;
  tenantId: string;
  missionId?: string;
  purposes?: string[];
  consentScopes?: string[];
  maxItems?: number;
}): MapAbleContextRecord[] {
  if (
    !isContextFabricEnabled() ||
    !isAgencyMemoryEnabled() ||
    !isAgencyMemoryModelContextEnabled()
  ) {
    return [];
  }

  const items = retrieveScopedMemory({
    participantId: params.participantId,
    tenantId: params.tenantId,
    purposes: params.purposes,
    consentScopes: params.consentScopes,
    missionId: params.missionId,
    maxItems: params.maxItems ?? 8,
  });

  const now = new Date().toISOString();
  return items.map((item) => ({
    contextId: `agency-memory:${item.memoryId}`,
    contextType: "participant_declared_preference",
    subjectRefs: [{ kind: "participant", id: item.participantId }],
    domain: "mission",
    tenantId: item.tenantId,
    sourceType: "participant_declared",
    sourceRef: item.memoryId,
    sourceAuthority: "participant",
    observedAt: item.confirmedAt ?? item.effectiveFrom,
    receivedAt: now,
    freshnessStatus: "current",
    verificationStatus: "verified",
    evidenceRefs: item.evidenceRefs.map(
      (r) => `${r.entityType}:${r.entityId}`,
    ),
    dataClasses: ["participant_pii"],
    consentScopes: item.consentScopes,
    payload: {
      memoryId: item.memoryId,
      category: item.category,
      statement: item.statement,
      structuredValue: item.structuredValue ?? null,
      purpose: item.purpose ?? null,
    },
    traceId: randomUUID(),
    consentRevokedAt: null,
    missionIds: params.missionId ? [params.missionId] : [],
  }));
}

export function buildAgencyMemoryContextSlice(params: {
  participantId: string;
  tenantId: string;
  missionId?: string;
  purposes?: string[];
  consentScopes?: string[];
  maxItems?: number;
}): {
  records: MapAbleContextRecord[];
  note: string;
} {
  const records = agencyMemoryToContextRecords(params);
  return {
    records,
    note:
      records.length === 0
        ? "No Agency Memory injected (flags off, paused, empty, or not confirmed)."
        : `Injected ${records.length} confirmed, purpose-scoped Agency Memory item(s).`,
  };
}
