import type {
  AgenticInvoiceDraft,
  BillingGraph,
  BillingGraphPatch,
  GuardrailDecision,
} from "@/server/billing/billingTypes";

export function buildBillingGraph(
  draft: AgenticInvoiceDraft,
  guardrailDecision: GuardrailDecision
): BillingGraph {
  const nodes: BillingGraph["nodes"] = [
    {
      id: `participant:${draft.participantId}`,
      type: "participant",
      label: "Participant",
    },
    {
      id: `invoice:${draft.id}`,
      type: "invoice_draft",
      label: "Invoice draft",
      metadata: { status: draft.status, totalCents: draft.totalCents },
    },
  ];
  const edges: BillingGraph["edges"] = [
    {
      from: `participant:${draft.participantId}`,
      to: `invoice:${draft.id}`,
      relation: "has_booking",
    },
  ];

  for (const bookingId of draft.bookingIds) {
    const nodeId = `booking:${bookingId}`;
    nodes.push({ id: nodeId, type: "booking", label: "Confirmed booking" });
    edges.push({
      from: `participant:${draft.participantId}`,
      to: nodeId,
      relation: "has_booking",
    });
    edges.push({
      from: nodeId,
      to: `invoice:${draft.id}`,
      relation: "billed_on",
    });
  }

  for (const line of draft.lineItems) {
    const lineId = `line:${line.id}`;
    nodes.push({
      id: lineId,
      type: "line_item",
      label: line.description.slice(0, 80),
      metadata: { totalCents: line.totalAmountCents },
    });
    edges.push({
      from: `booking:${line.bookingId}`,
      to: lineId,
      relation: "billed_on",
    });
    edges.push({
      from: lineId,
      to: `invoice:${draft.id}`,
      relation: "billed_on",
    });

    const evidenceId = `evidence:${line.bookingId}`;
    if (!nodes.some((n) => n.id === evidenceId)) {
      nodes.push({
        id: evidenceId,
        type: "evidence",
        label: line.evidence.summary,
        metadata: { evidenceType: line.evidence.evidenceType },
      });
      edges.push({
        from: `booking:${line.bookingId}`,
        to: evidenceId,
        relation: "supported_by",
      });
      edges.push({
        from: evidenceId,
        to: lineId,
        relation: "supported_by",
      });
    }
  }

  const guardrailNodeId = `guardrail:${draft.id}`;
  nodes.push({
    id: guardrailNodeId,
    type: "guardrail",
    label: `Guardrails: ${guardrailDecision.overallStatus}`,
    metadata: {
      requiresApproval: guardrailDecision.requiresApproval,
    },
  });
  edges.push({
    from: guardrailNodeId,
    to: `invoice:${draft.id}`,
    relation: "evaluated_by",
  });
  edges.push({
    from: `participant:${draft.participantId}`,
    to: `invoice:${draft.id}`,
    relation: "requires_approval",
  });

  return { invoiceId: draft.id, nodes, edges };
}

export function graphToPatch(graph: BillingGraph): BillingGraphPatch {
  return {
    appendNodes: graph.nodes,
    appendEdges: graph.edges,
  };
}

export function mergeGraphPatch(
  graph: BillingGraph,
  patch: BillingGraphPatch
): BillingGraph {
  const nodeIds = new Set(graph.nodes.map((n) => n.id));
  const edgeKeys = new Set(
    graph.edges.map((e) => `${e.from}|${e.to}|${e.relation}`)
  );
  const nodes = [...graph.nodes];
  const edges = [...graph.edges];

  for (const node of patch.appendNodes) {
    if (!nodeIds.has(node.id)) {
      nodes.push(node);
      nodeIds.add(node.id);
    }
  }
  for (const edge of patch.appendEdges) {
    const key = `${edge.from}|${edge.to}|${edge.relation}`;
    if (!edgeKeys.has(key)) {
      edges.push(edge);
      edgeKeys.add(key);
    }
  }

  return { invoiceId: graph.invoiceId, nodes, edges };
}
