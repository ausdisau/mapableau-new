export type ParticipationDomainValue =
  | "recreation"
  | "sport"
  | "arts"
  | "culture"
  | "music"
  | "faith"
  | "volunteering"
  | "education"
  | "training"
  | "employment"
  | "advocacy"
  | "civic"
  | "peer_support"
  | "social"
  | "travel"
  | "online"
  | "health_and_wellbeing"
  | "participant_defined"
  | "other";

export type ParticipationPrivacyLevelValue =
  | "private"
  | "household"
  | "authorised_support"
  | "organisation_minimum"
  | "public_listing_safe";

export type ParticipationGoalStatusValue =
  | "draft"
  | "clarifying"
  | "active"
  | "confirmed"
  | "paused"
  | "achieved"
  | "partially_achieved"
  | "changed"
  | "abandoned"
  | "expired"
  | "archived"
  | "completed"
  | "cancelled";

export type OpportunityStatusValue =
  | "draft"
  | "pending_review"
  | "published"
  | "hidden"
  | "suspended"
  | "expired"
  | "archived";

export type OpportunityDeliveryModeValue = "in_person" | "online" | "hybrid";

export type ParticipationPlanStatusValue =
  | "draft"
  | "simulated"
  | "awaiting_approval"
  | "approved"
  | "executing"
  | "completed"
  | "cancelled"
  | "paused";

export interface ParticipantApprovedDiscoveryFilters {
  domains?: ParticipationDomainValue[];
  keywords?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  accessNeeds?: string[];
  deliveryModes?: OpportunityDeliveryModeValue[];
  includeSponsored?: boolean;
}
