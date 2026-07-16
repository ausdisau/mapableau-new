export interface ContinuityPlaybookDefinition {
  code: string;
  version: string;
  title: string;
  applicableFailureClasses: string[];
  initialSafetyChecks: string[];
  informationRequired: string[];
  participantQuestions: string[];
  prohibitedAssumptions: string[];
  immediateOptions: string[];
  shortTermOptions: string[];
  longerTermOptions: string[];
  requiredHumanRoles: string[];
  partnerServices: string[];
  rightsAndComplaintRoutes: string[];
  evidenceRequirements: string[];
  highRisk: boolean;
  reviewOwner: string;
}

export const PLAYBOOKS: ContinuityPlaybookDefinition[] = [
  {
    code: "accessible_transport_cancellation",
    version: "1.0.0",
    title: "Accessible transport cancellation",
    applicableFailureClasses: ["AVAILABILITY", "ACCESSIBILITY", "TIMING"],
    initialSafetyChecks: [
      "Confirm participant is safe",
      "Do not contact unsafe supporters",
      "Preserve original goal wording",
    ],
    informationRequired: [
      "trip_reference",
      "cancellation_time",
      "mobility_requirements",
      "arrival_deadline",
    ],
    participantQuestions: [
      "Do you want to keep the original appointment time if possible?",
      "Are you willing to consider a verified accessible replacement vehicle?",
      "Should a human transport coordinator help?",
    ],
    prohibitedAssumptions: [
      "That any replacement vehicle is accessible",
      "That the participant can travel without required supports",
      "That simulated fleet data is live availability",
    ],
    immediateOptions: [
      "verified_accessible_replacement",
      "human_transport_coordination",
      "reschedule_with_employer_notification_proposal",
    ],
    shortTermOptions: ["temporary_community_transport", "support_worker_timing_adjust"],
    longerTermOptions: ["provider_reliability_review", "friction_ledger_entry"],
    requiredHumanRoles: ["transport_coordinator", "navigator"],
    partnerServices: ["transport", "care", "jobs"],
    rightsAndComplaintRoutes: ["provider_complaint", "rights_centre"],
    evidenceRequirements: [
      "cancellation_event",
      "vehicle_accessibility_compatibility",
      "participant_approval",
    ],
    highRisk: false,
    reviewOwner: "continuity-os-transport",
  },
  {
    code: "support_worker_cancellation",
    version: "1.0.0",
    title: "Support worker cancellation or no-show",
    applicableFailureClasses: ["AVAILABILITY", "TIMING"],
    initialSafetyChecks: ["Confirm immediate safety", "Preserve unfamiliar-worker preference"],
    informationRequired: ["shift_reference", "excluded_worker", "departure_dependency"],
    participantQuestions: [
      "Is an unfamiliar replacement worker acceptable?",
      "Would you rather change transport or start time?",
    ],
    prohibitedAssumptions: [
      "Automatic worker assignment is allowed",
      "Participant failure caused the cancellation",
    ],
    immediateOptions: [
      "backup_shift_recovery_proposal",
      "change_transport_time",
      "employer_notification_proposal",
      "human_care_coordination",
    ],
    shortTermOptions: ["temporary_roster_cover"],
    longerTermOptions: ["provider_reliability_review"],
    requiredHumanRoles: ["provider_manager", "navigator"],
    partnerServices: ["care", "transport"],
    rightsAndComplaintRoutes: ["provider_complaint", "rights_centre"],
    evidenceRequirements: ["cancellation_or_no_show_signal", "participant_approval"],
    highRisk: false,
    reviewOwner: "continuity-os-care",
  },
  {
    code: "inaccessible_replacement_vehicle",
    version: "1.0.0",
    title: "Inaccessible replacement vehicle",
    applicableFailureClasses: ["ACCESSIBILITY"],
    initialSafetyChecks: ["Reject false restored state", "Keep hard requirements visible"],
    informationRequired: ["replacement_vehicle_id", "mobility_requirements"],
    participantQuestions: ["Continue recovery with another option?"],
    prohibitedAssumptions: ["Operator acknowledgement equals completed recovery"],
    immediateOptions: ["exclude_vehicle", "human_transport_coordination"],
    shortTermOptions: ["complaint_draft"],
    longerTermOptions: ["accessibility_ops_review"],
    requiredHumanRoles: ["transport_coordinator", "accessibility_ops"],
    partnerServices: ["transport", "accessibility_ops"],
    rightsAndComplaintRoutes: ["provider_complaint", "rights_centre"],
    evidenceRequirements: ["compatibility_assessment"],
    highRisk: false,
    reviewOwner: "continuity-os-transport",
  },
  {
    code: "family_violence_safe_mode",
    version: "1.0.0",
    title: "Family violence / unsafe supporter pathway",
    applicableFailureClasses: ["QUALITY_AND_SAFETY", "DATA_AND_AUTHORITY"],
    initialSafetyChecks: [
      "Do not contact the named supporter",
      "Minimise notifications",
      "Preserve quick exit",
      "Route to specialist human pathway",
    ],
    informationRequired: ["participant_safe_contact_channel"],
    participantQuestions: ["Do you want a specialist human pathway now?"],
    prohibitedAssumptions: [
      "Ordinary recovery automation is safe",
      "AURA may investigate or close the concern",
    ],
    immediateOptions: ["specialist_human_escalation", "review_device_and_account_access"],
    shortTermOptions: ["authority_review"],
    longerTermOptions: ["privacy_officer_review"],
    requiredHumanRoles: ["rights_officer", "privacy_officer", "safeguarding_human"],
    partnerServices: ["rights", "specialist_partner"],
    rightsAndComplaintRoutes: ["specialist_human_pathway"],
    evidenceRequirements: ["participant_private_report"],
    highRisk: true,
    reviewOwner: "safeguarding-lead",
  },
  {
    code: "equipment_breakdown",
    version: "1.0.0",
    title: "Equipment breakdown",
    applicableFailureClasses: ["AVAILABILITY", "ACCESSIBILITY"],
    initialSafetyChecks: ["Do not guarantee battery range", "Separate temporary vs long-term"],
    informationRequired: ["equipment_passport_ref", "failure_symptom"],
    participantQuestions: ["Is a verified loaner acceptable?"],
    prohibitedAssumptions: ["Clinical readiness", "Range guarantees"],
    immediateOptions: ["verified_loaner_search", "at_repair_coordinator"],
    shortTermOptions: ["repair_booking_proposal"],
    longerTermOptions: ["replacement_planning"],
    requiredHumanRoles: ["equipment_repair_coordinator"],
    partnerServices: ["equipment"],
    rightsAndComplaintRoutes: ["consumer_guarantees_info", "rights_centre"],
    evidenceRequirements: ["equipment_record"],
    highRisk: false,
    reviewOwner: "continuity-os-equipment",
  },
  {
    code: "failed_hospital_to_home_handoff",
    version: "1.0.0",
    title: "Failed hospital-to-home handoff",
    applicableFailureClasses: ["HANDOFF", "AVAILABILITY"],
    initialSafetyChecks: [
      "Preserve clinician as clinical authority",
      "Keep unconfirmed home access unknown",
    ],
    informationRequired: ["discharge_status", "home_access_state", "support_roster_state"],
    participantQuestions: ["Which non-clinical dependencies should we chase first?"],
    prohibitedAssumptions: ["Mission ready on AURA authority", "Clinical readiness"],
    immediateOptions: ["questions_for_discharge_coordinator", "human_navigator"],
    shortTermOptions: ["track_handoff_accept_reject"],
    longerTermOptions: ["provider_roster_confirmation"],
    requiredHumanRoles: ["discharge_coordinator", "navigator"],
    partnerServices: ["care", "transport", "home"],
    rightsAndComplaintRoutes: ["rights_centre"],
    evidenceRequirements: ["handoff_receipt"],
    highRisk: false,
    reviewOwner: "continuity-os-transition-home",
  },
];

const BY_CODE = new Map(PLAYBOOKS.map((p) => [p.code, p]));

export function getPlaybook(code: string): ContinuityPlaybookDefinition | undefined {
  return BY_CODE.get(code);
}

export function requirePlaybook(code: string): ContinuityPlaybookDefinition {
  const found = BY_CODE.get(code);
  if (!found) throw new Error(`UNKNOWN_PLAYBOOK:${code}`);
  return found;
}

export function listPlaybooks(): ContinuityPlaybookDefinition[] {
  return PLAYBOOKS;
}
