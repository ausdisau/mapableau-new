import type {
  AccessAuditEvent,
  AccessDecision,
  AccessFeature,
  AccessPassport,
  AccessRequirement,
  AccessibleRoute,
  AgentAccessPlan,
  BuildingElement,
  ConfidenceLabel,
  DecisionStatus,
  Evidence,
  FeatureType,
  Importance,
  LiveIncident,
  MatchExplanation,
  Place,
  RouteEdge,
  RouteNode,
  SourceType,
  VisitPlan,
} from "./schemas";

export type {
  AccessAuditEvent,
  AccessDecision,
  AccessFeature,
  AccessPassport,
  AccessRequirement,
  AccessibleRoute,
  AgentAccessPlan,
  BuildingElement,
  ConfidenceLabel,
  DecisionStatus,
  Evidence,
  FeatureType,
  Importance,
  LiveIncident,
  MatchExplanation,
  Place,
  RouteEdge,
  RouteNode,
  SourceType,
  VisitPlan,
};

export type AccessGraph = {
  place: Place;
  elements: BuildingElement[];
  features: AccessFeature[];
  evidence: Evidence[];
  nodes: RouteNode[];
  edges: RouteEdge[];
};

export type ServerAccessContext = {
  userId: string;
  organisationId: string | null;
  selectedPassportId: string | null;
  demoMode: boolean;
};

export type PlaceSearchResult = {
  place: Place;
  matchReason: string;
};
