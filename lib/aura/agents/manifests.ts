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
    disclaimers: [
      "High-risk recovery still requires a human safety officer.",
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
