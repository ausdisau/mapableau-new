export type LifeEventCategory =
  | "EDUCATION"
  | "EMPLOYMENT"
  | "HOME_AND_COMMUNITY"
  | "HEALTH_AND_SUPPORT"
  | "FAMILY_AND_IDENTITY"
  | "SCHEME_AND_SERVICE";

export type LifeEventTypeCode =
  | "begin_school"
  | "change_school"
  | "leave_school"
  | "begin_tafe"
  | "begin_university"
  | "begin_apprenticeship"
  | "commence_placement"
  | "begin_job_search"
  | "interview"
  | "start_job"
  | "change_role"
  | "change_workplace"
  | "return_to_work"
  | "leave_employment"
  | "retire"
  | "search_for_housing"
  | "move_house"
  | "move_region"
  | "begin_independent_living"
  | "home_modification"
  | "change_household"
  | "relationship_separation"
  | "hospital_admission"
  | "hospital_to_home"
  | "rehabilitation_transition"
  | "new_equipment"
  | "equipment_replacement"
  | "provider_change"
  | "primary_carer_loss"
  | "new_support_arrangement"
  | "become_a_parent"
  | "family_change"
  | "bereavement"
  | "transition_to_adult_authority"
  | "change_supporter_or_nominee"
  | "change_communication_method"
  | "ndis_plan_change"
  | "programme_transition"
  | "aged_care_transition"
  | "employment_service_transition"
  | "interstate_move"
  | "international_travel";

export type MilestoneTemplateCode =
  | "information_gathered"
  | "decision_made"
  | "application_submitted"
  | "property_selected"
  | "employer_confirmed"
  | "equipment_ordered"
  | "transport_arranged"
  | "support_roster_confirmed"
  | "handoff_accepted"
  | "service_commenced"
  | "outcome_reviewed";

export type DependencyTemplateCode =
  | "participant_goal"
  | "workplace_entrance"
  | "lift"
  | "first_day_adjustment"
  | "accessible_transport"
  | "morning_support_worker"
  | "equipment_charger"
  | "arrival_deadline"
  | "employer_contact"
  | "calendar_block"
  | "communication_mode"
  | "home_access"
  | "support_roster"
  | "discharge_authority"
  | "backup_carer"
  | "funding_source"
  | "consent_authority";

export interface MilestoneTemplate {
  code: MilestoneTemplateCode;
  label: string;
  required: boolean;
  defaultOwnerRole: string;
}

export interface DependencyTemplate {
  code: DependencyTemplateCode;
  label: string;
  domain: string;
  required: boolean;
  defaultOwnerRole: string;
  alternativeHint?: string;
}

export interface LifeEventTypeDefinition {
  code: LifeEventTypeCode;
  category: LifeEventCategory;
  version: string;
  title: string;
  plainLanguageDescription: string;
  likelyDomains: string[];
  milestones: MilestoneTemplate[];
  dependencies: DependencyTemplate[];
  commonDocuments: string[];
  commonHandoffs: string[];
  accessibilityBarriers: string[];
  humanRoles: string[];
  policySourceKeys: string[];
  requiredWarnings: string[];
  prohibitedAutomatedDecisions: string[];
  reviewOwner: string;
}

export interface LifeEventTypeSummary {
  code: LifeEventTypeCode;
  category: LifeEventCategory;
  version: string;
  title: string;
  plainLanguageDescription: string;
}
