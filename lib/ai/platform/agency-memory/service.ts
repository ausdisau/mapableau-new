import { isAgencyMemoryEnabled } from "@/lib/config/agency-memory";

import {
  confirmMemory,
  deleteMemory,
  editMemory,
  proposeMemory,
  revokeMemory,
  updateControls,
} from "./confirm";
import { detectConflicts } from "./conflicts";
import { exportAgencyMemory } from "./export";
import { getActivePreferenceGraph, rebuildPreferenceGraph } from "./graph";
import { formatAgencyMemoryForParticipant } from "./presentation";
import { CAREOS_KEY_TO_CATEGORY } from "./registry";
import type {
  ConfirmMemoryInput,
  ControlsUpdateInput,
  DeleteMemoryInput,
  EditMemoryInput,
  ProposeMemoryInput,
  RevokeMemoryInput,
  ScopedRetrievalInput,
} from "./schemas";
import {
  proposeMemoryInputSchema,
  scopedRetrievalSchema,
} from "./schemas";
import {
  communicationPreferenceValue,
  listUsableForPersonalisation,
  providerExclusionRespected,
} from "./scope";
import {
  getAuditVersions,
  getControls,
  getMemoryItem,
  listMemoryItems,
} from "./store";
import type { MapAbleAgencyMemoryItem } from "./types";

export type AgencyMemorySnapshot = {
  items: MapAbleAgencyMemoryItem[];
  graph: ReturnType<typeof getActivePreferenceGraph>;
  controls: ReturnType<typeof getControls>;
  conflicts: ReturnType<typeof detectConflicts>;
  presentation: ReturnType<typeof formatAgencyMemoryForParticipant>;
};

export function getAgencyMemorySnapshot(params: {
  participantId: string;
  tenantId: string;
}): AgencyMemorySnapshot {
  if (!isAgencyMemoryEnabled()) {
    throw new Error("AGENCY_MEMORY_DISABLED");
  }
  const items = listMemoryItems(params);
  const graph = getActivePreferenceGraph(params);
  const controls = getControls(params);
  const conflicts = detectConflicts(params);
  const presentation = formatAgencyMemoryForParticipant({
    items,
    graph,
    controls,
    conflicts,
  });
  return { items, graph, controls, conflicts, presentation };
}

export function retrieveScopedMemory(
  input: ScopedRetrievalInput,
): MapAbleAgencyMemoryItem[] {
  const parsed = scopedRetrievalSchema.parse(input);
  if (!isAgencyMemoryEnabled()) return [];
  return listUsableForPersonalisation({
    ...parsed,
    forModelContext: true,
  }).slice(0, parsed.maxItems);
}

/**
 * Bridge from Prompt 02 save_participant_preference into Agency Memory.
 * Creates a participant-confirmed memory item (action kernel already required approval).
 */
export function savePreferenceViaAgencyMemory(params: {
  participantId: string;
  tenantId: string;
  actorId: string;
  key: string;
  value: unknown;
  expiresAt?: string | null;
  consentScopes?: string[];
}): MapAbleAgencyMemoryItem {
  const category = CAREOS_KEY_TO_CATEGORY[params.key] ?? "interaction";
  const input: ProposeMemoryInput = proposeMemoryInputSchema.parse({
    participantId: params.participantId,
    tenantId: params.tenantId,
    category,
    statement: `Preference ${params.key}: ${typeof params.value === "string" ? params.value : JSON.stringify(params.value)}`,
    structuredValue: { key: params.key, value: params.value },
    source: "participant_explicit",
    consentScopes: params.consentScopes ?? ["profile.write"],
    visibility: "participant_only",
    expiresAt: params.expiresAt ?? null,
    evidenceRefs: [
      {
        entityType: "CareOSParticipantPreference",
        entityId: params.key,
        label: params.key,
      },
    ],
    autoConfirmIfParticipantExplicit: true,
    actorId: params.actorId,
  });
  return proposeMemory(input);
}

export {
  proposeMemory,
  confirmMemory,
  revokeMemory,
  deleteMemory,
  editMemory,
  updateControls,
  exportAgencyMemory,
  rebuildPreferenceGraph,
  getActivePreferenceGraph,
  detectConflicts,
  listMemoryItems,
  getMemoryItem,
  getControls,
  getAuditVersions,
  providerExclusionRespected,
  communicationPreferenceValue,
  listUsableForPersonalisation,
};

export type {
  ProposeMemoryInput,
  ConfirmMemoryInput,
  RevokeMemoryInput,
  DeleteMemoryInput,
  EditMemoryInput,
  ControlsUpdateInput,
  ScopedRetrievalInput,
};
