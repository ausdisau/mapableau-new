import type { AccessGraphAssertionProvenance } from "@mapable/contracts";

import { projectEvidenceClassToProvenance } from "../evidence/provenance-projection";
import type { AccessGraphEdge, AccessGraphNode } from "./types";

export type AccessGraphListItemWithProvenance = {
  id: string;
  kind: string;
  label: string;
  summary: string;
  temporalState: string;
  evidenceClass: string;
  canonicalRef: string | null;
  provenance: AccessGraphAssertionProvenance;
};

export type AccessGraphEdgeListItemWithProvenance = {
  id: string;
  from: string;
  to: string;
  kind: string;
  label: string;
  temporalState: string;
  provenance: AccessGraphAssertionProvenance;
};

export function projectNodeProvenance(
  node: AccessGraphNode,
): AccessGraphAssertionProvenance {
  return projectEvidenceClassToProvenance({
    evidenceClass: node.evidenceClass,
    temporalState: node.temporalState,
    observedAt: node.observedAt,
    source: node.canonicalRef ?? node.kind,
  });
}

export function projectEdgeProvenance(
  edge: AccessGraphEdge,
  observedAt: string,
): AccessGraphAssertionProvenance {
  return projectEvidenceClassToProvenance({
    evidenceClass: edge.evidenceClass,
    temporalState: edge.temporalState,
    observedAt,
    source: edge.kind,
  });
}
