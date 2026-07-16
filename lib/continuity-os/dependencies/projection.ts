import type { LifeEventTypeDefinition } from "@/lib/continuity-os/taxonomy/types";

export type DependencyNodeState =
  | "unknown"
  | "unconfirmed"
  | "confirmed"
  | "failed"
  | "restored"
  | "optional_absent"
  | "stale";

export interface DependencyNode {
  id: string;
  code: string;
  label: string;
  domain: string;
  required: boolean;
  state: DependencyNodeState;
  ownerRole: string;
  ownerOrganisationLabel: string;
  mapableRole: string;
  participantRole: string;
  evidence: string[];
  freshness: "fresh" | "stale" | "unknown";
  alternativeHint?: string;
  failureImpact: string;
  reviewDate?: string;
}

export interface DependencyEdge {
  id: string;
  from: string;
  to: string;
  type:
    | "requires"
    | "depends_on"
    | "owned_by"
    | "alternative_to"
    | "must_arrive_before"
    | "recoverable_through";
}

export interface ResponsibilityRow {
  dependencyCode: string;
  serviceProvider: string;
  contractingOrganisation: string;
  workerOrOperator: string;
  mapableRole: string;
  participantRole: string;
  supporterRole: string;
  decisionAuthority: string;
  complaintRoute: string;
  cancellationResponsibility: string;
  financialResponsibility: string;
  recoveryResponsibility: string;
}

export interface DependencyProjection {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  responsibilities: ResponsibilityRow[];
  unknowns: string[];
  blockers: string[];
  singlePointsOfFailure: string[];
}

function ownerOrgLabel(role: string): string {
  switch (role) {
    case "participant":
      return "Participant-controlled";
    case "employer":
      return "Employer / workplace";
    case "transport_operator":
      return "Transport provider";
    case "provider_manager":
      return "Support provider organisation";
    case "clinical_coordinator":
      return "Authorised clinical service";
    case "equipment_supplier":
      return "Equipment supplier";
    case "venue":
      return "Venue operator";
    case "navigator":
      return "MapAble / partner navigator";
    default:
      return role;
  }
}

/**
 * Build a read-only dependency projection from a life-event template.
 * Does not invent confirmed availability — unknowns stay unknown.
 */
export function projectDependenciesFromTemplate(params: {
  definition: LifeEventTypeDefinition;
  participantGoal: string;
  knownCommitments?: string[];
  unknowns?: string[];
  blockers?: string[];
  confirmedDependencyCodes?: string[];
  failedDependencyCodes?: string[];
}): DependencyProjection {
  const confirmed = new Set(params.confirmedDependencyCodes ?? []);
  const failed = new Set(params.failedDependencyCodes ?? []);
  const unknowns = [...(params.unknowns ?? [])];
  const blockers = [...(params.blockers ?? [])];

  const nodes: DependencyNode[] = params.definition.dependencies.map((dep) => {
    let state: DependencyNodeState = "unconfirmed";
    if (failed.has(dep.code)) state = "failed";
    else if (confirmed.has(dep.code)) state = "confirmed";
    else if (!dep.required) state = "unconfirmed";
    else state = "unconfirmed";

    if (dep.code === "participant_goal") {
      state = params.participantGoal.trim() ? "confirmed" : "unknown";
    }

    // Reception assistance and similar unspecified supports stay unknown unless confirmed.
    if (
      dep.code === "first_day_adjustment" &&
      !confirmed.has(dep.code) &&
      !failed.has(dep.code)
    ) {
      state = "unknown";
      if (!unknowns.includes("reception_or_first_day_assistance")) {
        unknowns.push("reception_or_first_day_assistance");
      }
    }

    return {
      id: `dep-${dep.code}`,
      code: dep.code,
      label: dep.label,
      domain: dep.domain,
      required: dep.required,
      state,
      ownerRole: dep.defaultOwnerRole,
      ownerOrganisationLabel: ownerOrgLabel(dep.defaultOwnerRole),
      mapableRole: "coordinate_and_explain",
      participantRole: "decide_and_approve",
      evidence: confirmed.has(dep.code) ? ["participant_or_service_confirmation"] : [],
      freshness: confirmed.has(dep.code) ? "fresh" : "unknown",
      alternativeHint: dep.alternativeHint,
      failureImpact: dep.required
        ? "May block time-critical milestones until recovered or replanned."
        : "May increase friction; does not automatically block the goal.",
    };
  });

  const goalNode = nodes.find((n) => n.code === "participant_goal");
  const edges: DependencyEdge[] = [];
  for (const node of nodes) {
    if (node.code === "participant_goal" || !goalNode) continue;
    edges.push({
      id: `edge-${node.code}-requires-goal`,
      from: node.id,
      to: goalNode.id,
      type: "requires",
    });
    if (node.code === "accessible_transport") {
      const arrival = nodes.find((n) => n.code === "arrival_deadline");
      if (arrival) {
        edges.push({
          id: `edge-transport-before-arrival`,
          from: node.id,
          to: arrival.id,
          type: "must_arrive_before",
        });
      }
    }
    if (node.code === "morning_support_worker") {
      const transport = nodes.find((n) => n.code === "accessible_transport");
      if (transport) {
        edges.push({
          id: `edge-worker-before-transport`,
          from: node.id,
          to: transport.id,
          type: "depends_on",
        });
      }
    }
  }

  const responsibilities: ResponsibilityRow[] = nodes.map((node) => ({
    dependencyCode: node.code,
    serviceProvider: node.ownerOrganisationLabel,
    contractingOrganisation: node.ownerOrganisationLabel,
    workerOrOperator: node.ownerRole,
    mapableRole: "Orchestrate, explain, never auto-assign",
    participantRole: "Primary decision-maker",
    supporterRole: "Only if purpose-bound authority granted",
    decisionAuthority: "participant",
    complaintRoute: "MapAble Rights Centre / provider complaint path",
    cancellationResponsibility: node.ownerOrganisationLabel,
    financialResponsibility: "Per service agreement — shown before approval",
    recoveryResponsibility: `${node.ownerOrganisationLabel} with participant approval`,
  }));

  const singlePointsOfFailure = nodes
    .filter(
      (n) =>
        n.required &&
        (n.state === "unconfirmed" || n.state === "unknown" || n.state === "failed") &&
        !n.alternativeHint
    )
    .map((n) => n.code);

  // Transport and morning worker are classic SPOFs even with alternative hints until verified.
  for (const code of ["accessible_transport", "morning_support_worker"]) {
    const node = nodes.find((n) => n.code === code);
    if (
      node &&
      node.required &&
      node.state !== "confirmed" &&
      !singlePointsOfFailure.includes(code)
    ) {
      singlePointsOfFailure.push(code);
    }
  }

  for (const commitment of params.knownCommitments ?? []) {
    if (!unknowns.includes(`commitment:${commitment}`)) {
      // Known commitments are recorded on the mission; not unknowns.
    }
  }

  return {
    nodes,
    edges,
    responsibilities,
    unknowns,
    blockers,
    singlePointsOfFailure,
  };
}

/** Structured list alternative for any visual graph. */
export function dependencyProjectionAsList(projection: DependencyProjection): Array<{
  label: string;
  state: string;
  owner: string;
  required: boolean;
  alternative?: string;
}> {
  return projection.nodes.map((node) => ({
    label: node.label,
    state: node.state,
    owner: node.ownerOrganisationLabel,
    required: node.required,
    alternative: node.alternativeHint,
  }));
}
