import type {
  ContinuityAlert,
  MissionGraph,
  MissionGraphNode,
  MissionNodeStatus,
} from "./types";

export function analyseMissionContinuity(graph: MissionGraph): ContinuityAlert[] {
  const alerts: ContinuityAlert[] = [];
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));

  for (const n of graph.nodes) {
    if (n.status === "not_authorised") {
      alerts.push({
        id: `continuity-not-authorised-${n.id}`,
        severity: "attention" as const,
        code: "NOT_AUTHORISED",
        explanation: `${n.label} could not be read because the actor lacks authority.`,
        affectedNodeIds: [n.id],
        recoveryOptions: [
          "Review permissions",
          "Continue via non-AI MapAble services",
        ],
        humanReviewRequired: false,
      });
    }
    if (n.status === "consent_required") {
      alerts.push({
        id: `continuity-consent-${n.id}`,
        severity: "attention" as const,
        code: "CONSENT_REQUIRED",
        explanation: `${n.label} requires participant consent before use.`,
        affectedNodeIds: [n.id],
        recoveryOptions: [
          "Grant consent for this purpose",
          "Continue without profile data",
        ],
        humanReviewRequired: false,
      });
    }
    if (n.status === "disabled") {
      alerts.push({
        id: `continuity-disabled-${n.id}`,
        severity: "information" as const,
        code: "MODULE_DISABLED",
        explanation: `${n.label} intelligence is disabled; standard services remain available.`,
        affectedNodeIds: [n.id],
        recoveryOptions: ["Use standard MapAble services"],
        humanReviewRequired: false,
      });
    }
  }

  const interview = byId.get("node-job-interview");
  const transport = byId.get("node-transport");
  const care = byId.get("node-care-support");
  const workplaceAccess = byId.get("node-workplace-access");

  if (interview && transport && transport.status === "missing") {
    alerts.push({
      id: "continuity-interview-no-transport",
      severity: "attention" as const,
      code: "TRANSPORT_UNCONFIRMED",
      explanation:
        "A work event is identified but no confirmed accessible transport journey exists.",
      affectedNodeIds: [interview.id, transport.id],
      recoveryOptions: [
        "Prepare an accessible transport request draft",
        "Confirm you already have transport arranged",
      ],
      humanReviewRequired: false,
    });
  }

  if (interview && care && care.status === "missing") {
    alerts.push({
      id: "continuity-interview-no-support",
      severity: "attention" as const,
      code: "CARE_COVERAGE_UNCONFIRMED",
      explanation:
        "Support for interview preparation or attendance is not confirmed.",
      affectedNodeIds: [interview.id, care.id],
      recoveryOptions: [
        "Prepare a support request draft",
        "Request human coordination",
      ],
      humanReviewRequired: false,
    });
  }

  if (interview && workplaceAccess && workplaceAccess.status === "missing") {
    alerts.push({
      id: "continuity-workplace-access-missing",
      severity: "attention" as const,
      code: "ACCESS_EVIDENCE_MISSING",
      explanation:
        "Onsite work is planned but workplace accessibility evidence is missing.",
      affectedNodeIds: [interview.id, workplaceAccess.id],
      recoveryOptions: [
        "Review workplace accessibility evidence",
        "Prepare questions for the employer without disclosing disability",
      ],
      humanReviewRequired: false,
    });
  }

  return alerts;
}

function statusRank(status: MissionNodeStatus): number {
  switch (status) {
    case "confirmed":
      return 0;
    case "available":
      return 1;
    case "needs_review":
      return 2;
    case "missing":
      return 3;
    case "consent_required":
      return 4;
    case "not_authorised":
      return 5;
    case "disabled":
      return 6;
    case "unavailable":
      return 7;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function worstNodeStatus(nodes: MissionGraphNode[]): MissionNodeStatus {
  if (nodes.length === 0) return "missing";
  return nodes.reduce(
    (worst, n) => (statusRank(n.status) > statusRank(worst) ? n.status : worst),
    nodes[0]!.status,
  );
}
