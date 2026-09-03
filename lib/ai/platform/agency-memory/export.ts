import { getActivePreferenceGraph } from "./graph";
import { getCategoryEntry } from "./registry";
import { listMemoryItems } from "./store";
import type { AgencyMemoryExportBundle, MapAbleAgencyMemoryItem } from "./types";

function toHumanReadable(items: MapAbleAgencyMemoryItem[]): string {
  const lines = [
    "MapAble Agency Memory export",
    "============================",
    "",
    "Only items you confirmed (or explicitly supplied) are listed as active preferences.",
    "",
  ];
  for (const item of items.filter((i) => !i.deletedAt)) {
    const cat = getCategoryEntry(item.category);
    lines.push(`• [${cat.label}] ${item.statement}`);
    lines.push(`  State: ${item.confirmationState}`);
    lines.push(`  Source: ${item.source}`);
    if (item.purpose) lines.push(`  Purpose: ${item.purpose}`);
    lines.push(`  Visibility: ${item.visibility}`);
    lines.push("");
  }
  return lines.join("\n");
}

export function exportAgencyMemory(params: {
  participantId: string;
  tenantId: string;
}): AgencyMemoryExportBundle {
  const items = listMemoryItems({
    participantId: params.participantId,
    tenantId: params.tenantId,
    includeDeleted: false,
  }).filter((i) => i.confirmationState === "confirmed");

  const graph = getActivePreferenceGraph(params);
  const humanReadable = toHumanReadable(items);

  return {
    exportedAt: new Date().toISOString(),
    participantId: params.participantId,
    format: "structured_json",
    items,
    graph,
    humanReadable,
    note: "Export includes confirmed Agency Memory only. Proposed or revoked items are omitted from the portable preference set.",
  };
}
