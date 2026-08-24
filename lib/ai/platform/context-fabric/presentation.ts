/**
 * Accessible provenance presentation for My MapAble (WCAG 2.2 AA).
 * Exposes source, date, verification state, why used, and correction route.
 */

import { buildProvenanceDisplay } from "./provenance";
import type { MapAbleContextRecord, ProvenanceDisplay } from "./types";

export type ContextProvenanceViewModel = ProvenanceDisplay & {
  contextId: string;
  contextType: string;
  domain: string;
  ariaLabel: string;
};

export function formatContextForParticipant(
  record: MapAbleContextRecord,
): ContextProvenanceViewModel {
  const display = buildProvenanceDisplay(record);
  return {
    ...display,
    contextId: record.contextId,
    contextType: record.contextType,
    domain: record.domain,
    ariaLabel: display.accessibleSummary,
  };
}

export function formatContextListForParticipant(
  records: MapAbleContextRecord[],
): ContextProvenanceViewModel[] {
  return records.map(formatContextForParticipant);
}
