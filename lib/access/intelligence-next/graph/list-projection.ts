import type { LivingAccessGraphSnapshot } from "./types";
import {
  projectEdgeProvenance,
  projectNodeProvenance,
  type AccessGraphEdgeListItemWithProvenance,
  type AccessGraphListItemWithProvenance,
} from "./provenance-projection";

export type AccessGraphListItem = AccessGraphListItemWithProvenance;
export type AccessGraphEdgeListItem = AccessGraphEdgeListItemWithProvenance;

/** Accessible list alternative to any graph visualisation. */
export function projectGraphToList(
  graph: LivingAccessGraphSnapshot,
): AccessGraphListItem[] {
  return graph.nodes.map((n) => ({
    id: n.id,
    kind: n.kind,
    label: n.label,
    summary: n.listSummary,
    temporalState: n.temporalState,
    evidenceClass: n.evidenceClass,
    canonicalRef: n.canonicalRef,
    provenance: projectNodeProvenance(n),
  }));
}

export function projectEdgesToList(
  graph: LivingAccessGraphSnapshot,
): AccessGraphEdgeListItem[] {
  return graph.edges.map((e) => ({
    id: e.id,
    from: e.from,
    to: e.to,
    kind: e.kind,
    label: e.label,
    temporalState: e.temporalState,
    provenance: projectEdgeProvenance(e, graph.generatedAt),
  }));
}
