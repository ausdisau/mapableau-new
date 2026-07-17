import type { SpecialistManifestTemplate } from "@/lib/aura/agents/manifests";

const PARTICIPATION_PROHIBITED_ACTIONS = [
  "participation.define_meaningful_life",
  "participation.infer_loneliness",
  "participation.pressure_participation",
  "participation.reward_activity_quantity",
  "participation.expose_sensitive_affiliations",
  "participation.book_without_authority",
  "participation.spend_without_approval",
  "participation.infer_funding",
  "participation.contact_organisers_without_authority",
  "participation.publish_reflections",
];

export const PARTICIPATION_SPECIALIST_MANIFEST: SpecialistManifestTemplate = {
  slug: "participation",
  displayName: "AURA Participation",
  classification: "specialist_other",
  description:
    "Clarifies participant-defined participation goals, prepares access-aware community plans, and drafts authorised communications without scoring or pressuring participation.",
  allowedActionSlugs: [
    "participation.clarify_goals",
    "participation.search_opportunities",
    "participation.compare_access",
    "participation.prepare_organiser_questions",
    "participation.draft_itinerary",
    "participation.draft_rsvp",
    "participation.coordinate_approved_transport_support",
    "participation.monitor_access_changes",
    "participation.initiate_continuity_on_disruption",
    "participation.invite_private_reflection",
  ],
  prohibitedActionSlugs: PARTICIPATION_PROHIBITED_ACTIONS,
  requiresApprovalAtOrAbove: "medium_reversible",
  disclaimers: [
    "The participant defines what matters.",
    "Sensitive affiliations and reflections stay private.",
    "AURA cannot book, spend, contact organisers, or infer funding without authority.",
  ],
};
