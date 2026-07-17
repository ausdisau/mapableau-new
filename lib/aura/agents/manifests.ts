/**
 * Specialist agent manifest templates. These are the reference manifests used
 * to seed the Wave 10 agent registry. Each manifest lists the actions the
 * specialist may perform and inherits AURA's global safety constraints.
 *
 * The billing specialist is explicitly explain-only and NEVER approves
 * invoices, claims, or payments.
 */

export interface SpecialistManifestTemplate {
  slug: string;
  displayName: string;
  classification:
    | "core"
    | "care"
    | "transport"
    | "jobs"
    | "access"
    | "billing_explain_only"
    | "evidence"
    | "recovery"
    | "specialist_other";
  description: string;
  allowedActionSlugs: string[];
  prohibitedActionSlugs: string[];
  requiresApprovalAtOrAbove: "medium_reversible" | "high_irreversible";
  disclaimers: string[];
}

const NEVER_APPROVE = [
  "billing.approve_invoice",
  "billing.approve_claim",
  "payments.approve",
  "consent.grant_or_alter",
  "delegation.appoint_or_alter",
  "incident.reportability_decide",
  "safeguarding.close",
  "safety.release_kill_switch",
  "integration.activate_production",
  // Wave 11 additions — no emergency-service automation, no financial submits.
  "emergency.dispatch",
  "emergency.contact_000",
  "emergency.call_ambulance",
  "emergency.call_police",
  "emergency.call_fire",
  "emergency.mental_health_crisis_dispatch",
  "emergency.after_hours_safety_line",
  "billing.submit_claim",
  "invoices.approve",
  "invoices.submit",
  "claims.approve",
  "claims.submit",
];

export const SPECIALIST_MANIFESTS: SpecialistManifestTemplate[] = [
  {
    slug: "core",
    displayName: "AURA Core",
    classification: "core",
    description:
      "Handles plan orchestration, hand-off routing, and safety escalation.",
    allowedActionSlugs: [
      "goal.clarify",
      "plan.draft",
      "plan.simulate",
      "handoff.propose",
    ],
    prohibitedActionSlugs: NEVER_APPROVE,
    requiresApprovalAtOrAbove: "medium_reversible",
    disclaimers: [
      "AURA is not sentient.",
      "A human still confirms actions that affect your services or money.",
    ],
  },
  {
    slug: "care",
    displayName: "AURA Care",
    classification: "care",
    description: "Explains care options and drafts booking requests.",
    allowedActionSlugs: [
      "care.search_options",
      "care.draft_shift_request",
      "care.summarise_service_history",
    ],
    prohibitedActionSlugs: NEVER_APPROVE,
    requiresApprovalAtOrAbove: "medium_reversible",
    disclaimers: [
      "AURA Care cannot approve shifts or agreements. A person confirms.",
    ],
  },
  {
    slug: "transport",
    displayName: "AURA Transport",
    classification: "transport",
    description: "Explains transport options and drafts trip requests.",
    allowedActionSlugs: [
      "transport.search_options",
      "transport.draft_trip_request",
    ],
    prohibitedActionSlugs: NEVER_APPROVE,
    requiresApprovalAtOrAbove: "medium_reversible",
    disclaimers: ["A person confirms every booking."],
  },
  {
    slug: "jobs",
    displayName: "AURA Jobs",
    classification: "jobs",
    description: "Helps with accessible job discovery only.",
    allowedActionSlugs: ["jobs.search_public", "jobs.explain_role"],
    prohibitedActionSlugs: NEVER_APPROVE,
    requiresApprovalAtOrAbove: "medium_reversible",
    disclaimers: ["AURA Jobs is not a career adviser."],
  },
  {
    slug: "access",
    displayName: "AURA Access",
    classification: "access",
    description: "Explains accessibility information.",
    allowedActionSlugs: [
      "access.explain_feature",
      "access.compare_venues",
      "access.summarise_passport_share",
    ],
    prohibitedActionSlugs: NEVER_APPROVE,
    requiresApprovalAtOrAbove: "medium_reversible",
    disclaimers: [],
  },
  {
    slug: "billing-explain-only",
    displayName: "AURA Billing (Explain Only)",
    classification: "billing_explain_only",
    description:
      "AURA Billing only explains statements, disputes, and payment options. It NEVER approves invoices, claims, or payments.",
    allowedActionSlugs: [
      "billing.explain_statement",
      "billing.explain_dispute_options",
      "billing.summarise_history",
    ],
    prohibitedActionSlugs: NEVER_APPROVE,
    requiresApprovalAtOrAbove: "medium_reversible",
    disclaimers: [
      "AURA Billing cannot approve any payment, claim, or invoice.",
      "AURA Billing is not a financial adviser.",
    ],
  },
  {
    slug: "evidence",
    displayName: "AURA Evidence",
    classification: "evidence",
    description:
      "Collates and summarises evidence for participant-authorised sharing (via disclosure gateway).",
    allowedActionSlugs: [
      "evidence.collate_summary",
      "evidence.prepare_share_request",
    ],
    prohibitedActionSlugs: NEVER_APPROVE,
    requiresApprovalAtOrAbove: "medium_reversible",
    disclaimers: ["Sharing requires participant confirmation via Wave 9."],
  },
  {
    slug: "recovery",
    displayName: "AURA Recovery",
    classification: "recovery",
    description:
      "Guides a participant through account recovery steps (no shortcuts).",
    allowedActionSlugs: [
      "recovery.explain_options",
      "recovery.prepare_request",
    ],
    prohibitedActionSlugs: NEVER_APPROVE,
    requiresApprovalAtOrAbove: "high_irreversible",
    disclaimers: ["High-risk recovery still requires a human safety officer."],
  },
  {
    slug: "participation",
    displayName: "AURA Participation",
    classification: "specialist_other",
    description:
      "Helps participants clarify self-defined participation goals, search community opportunities, compare access information, and draft participant-approved plans without defining what a meaningful life is.",
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
    prohibitedActionSlugs: [
      ...NEVER_APPROVE,
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
    ],
    requiresApprovalAtOrAbove: "medium_reversible",
    disclaimers: [
      "The participant defines what matters; AURA does not define a meaningful life.",
      "AURA does not infer loneliness, social isolation, interests, diagnosis, or funding eligibility.",
      "Bookings, spending, organiser contact, and transport/support coordination require participant authority.",
      "Private reflections are never published or shared with organisers.",
    ],
  },
  {
    // Wave 11 — SERVICE recovery. Distinct from account recovery above.
    // This specialist supports service continuity: rescheduling, drafting
    // substitute booking requests, opening continuity cases, and simulating
    // recovery plans. It NEVER approves financial actions, alters consent,
    // dispatches emergency services, or auto-cancels linked services.
    slug: "service-recovery",
    displayName: "AURA Service Recovery",
    classification: "recovery",
    description:
      "Suggests service-continuity options (reschedule, substitute, waitlist, hand-off) and drafts recovery plans. Never approves payments, claims, invoices, or emergency dispatch. Cannot auto-cancel linked services.",
    allowedActionSlugs: [
      "continuity.explain_options",
      "continuity.draft_recovery_plan",
      "continuity.simulate_recovery_plan",
      "continuity.open_case_from_signal",
      "continuity.escalate_to_human",
      "continuity.propose_reservation",
    ],
    prohibitedActionSlugs: NEVER_APPROVE,
    requiresApprovalAtOrAbove: "medium_reversible",
    disclaimers: [
      "AURA Service Recovery is not a legal representative and does not decide financial matters.",
      "It cannot call 000 or dispatch emergency services — a human safety officer handles emergencies.",
      "It cannot auto-cancel a linked booking; a person confirms every service change.",
      "External civic feeds may be stale; recovery plans quote the feed and its freshness at execution.",
    ],
  },
  {
    // Wave 12 — AccessOps specialist. Explains civic access infrastructure,
    // status freshness, and journey options. Never guarantees safety, never
    // verifies community allegations, never actuates infrastructure, never
    // contacts regulators, never exposes participant access profiles.
    slug: "accessops",
    displayName: "AURA AccessOps",
    classification: "access",
    description:
      "Searches access assets, explains evidence and freshness, constructs whole-journey options with uncertainty, and prepares participant-approved reports. Never guarantees route safety or remotely controls infrastructure.",
    allowedActionSlugs: [
      "accessops.search_assets",
      "accessops.compare_venues",
      "accessops.explain_status",
      "accessops.explain_evidence",
      "accessops.plan_journey_options",
      "accessops.identify_uncertain_segments",
      "accessops.build_visit_plan_draft",
      "accessops.prepare_operator_questions",
      "accessops.monitor_selected_assets",
      "accessops.draft_community_report",
      "accessops.initiate_continuity_on_disruption",
    ],
    prohibitedActionSlugs: [
      ...NEVER_APPROVE,
      "accessops.guarantee_safety",
      "accessops.verify_community_allegation",
      "accessops.modify_operator_status",
      "accessops.actuate_infrastructure",
      "accessops.expose_participant_profile",
      "accessops.infer_disability",
      "accessops.contact_regulator",
      "accessops.publish_accusation",
      "accessops.reroute_without_authority",
    ],
    requiresApprovalAtOrAbove: "medium_reversible",
    disclaimers: [
      "AURA AccessOps cannot guarantee that a route is safe or currently usable.",
      "Community reports remain allegations until a human validates them.",
      "Missing or stale access data is not treated as accessible.",
      "AURA cannot remotely operate lifts, doors, gates, or kerb infrastructure.",
      "Participant access-fit details stay private and are never published.",
    ],
  },
];

export function isBillingApprovalAttempt(actionSlug: string): boolean {
  return (
    actionSlug === "billing.approve_invoice" ||
    actionSlug === "billing.approve_claim" ||
    actionSlug === "payments.approve"
  );
}

export function isEmergencyServiceAttempt(actionSlug: string): boolean {
  return (
    actionSlug === "emergency.dispatch" ||
    actionSlug === "emergency.contact_000" ||
    actionSlug === "emergency.call_ambulance" ||
    actionSlug === "emergency.call_police" ||
    actionSlug === "emergency.call_fire" ||
    actionSlug === "emergency.mental_health_crisis_dispatch"
  );
}

export function findServiceRecoveryManifest():
  | SpecialistManifestTemplate
  | undefined {
  return SPECIALIST_MANIFESTS.find((m) => m.slug === "service-recovery");
}

export function findAccessOpsManifest():
  | SpecialistManifestTemplate
  | undefined {
  return SPECIALIST_MANIFESTS.find((m) => m.slug === "accessops");
}

export function findParticipationManifest():
  | SpecialistManifestTemplate
  | undefined {
  return SPECIALIST_MANIFESTS.find((m) => m.slug === "participation");
}
