/**
 * Participant burden — system-imposed load attributed to workflows/organisations.
 * Never a participant complexity, worthiness, or capability score.
 */

export type AccessBurdenKind =
  | "repeated_disclosure"
  | "telephone_call"
  | "inaccessible_form"
  | "identity_retry"
  | "transfer"
  | "waiting"
  | "detour"
  | "added_distance"
  | "supporter_coordination"
  | "confirmation"
  | "handoff"
  | "complaint_step"
  | "uncertainty_check"
  | "recovery_action";

export type AccessBurdenAttribution =
  | "workflow"
  | "service"
  | "organisation"
  | "journey"
  | "policy"
  | "system";

export type AccessBurdenEvent = {
  id: string;
  kind: AccessBurdenKind;
  summary: string;
  attributedTo: string;
  attributionType: AccessBurdenAttribution;
  quantity: number;
  unit: "count" | "metres" | "minutes";
  journeyRef: string | null;
  organisationRef: string | null;
};

export type AccessBurdenProfile = {
  profileId: string;
  journeyRef: string;
  events: AccessBurdenEvent[];
  totals: {
    disclosures: number;
    calls: number;
    inaccessibleForms: number;
    detourMetres: number;
    handoffs: number;
    confirmations: number;
  };
  /** Explicit non-score statement for consumers. */
  notAParticipantScore: true;
  listAlternative: Array<{
    id: string;
    kind: AccessBurdenKind;
    summary: string;
    attributedTo: string;
  }>;
  limitations: string[];
  operatingMode: "synthetic" | "shadow";
  productionClaim: "none";
};
