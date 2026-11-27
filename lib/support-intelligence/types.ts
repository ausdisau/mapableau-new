import { z } from "zod";

/** Explicit ternary / unknown vocabulary — never invent positive claims. */
export const EvidenceStateSchema = z.enum([
  "confirmed",
  "declared",
  "unknown",
  "conflict",
  "stale",
  "withdrawn",
]);
export type EvidenceState = z.infer<typeof EvidenceStateSchema>;

export const ProvenanceSchema = z.object({
  sourceKind: z.enum([
    "ndia_directory",
    "ndis_commission_public",
    "mapable",
    "licensed_api",
    "approved_crawl",
    "participant_self_report",
    "authorised_screening",
    "synthetic_fixture",
  ]),
  sourceUrl: z.string().url().or(z.literal("fixture://local")),
  retrievedAt: z.string().datetime(),
  effectiveAt: z.string().datetime().optional(),
  rawHash: z.string().min(8),
  licenseAndReuse: z.string().optional(),
  validUntil: z.string().datetime().optional(),
});
export type Provenance = z.infer<typeof ProvenanceSchema>;

export const ClaimSchema = z.object({
  field: z.string(),
  value: z.unknown(),
  state: EvidenceStateSchema,
  evidenceUrl: z.string().optional(),
  checkedAt: z.string().datetime().optional(),
  attributedTo: z.string().optional(),
  note: z.string().optional(),
});
export type Claim = z.infer<typeof ClaimSchema>;

export const HumanReviewReasonSchema = z.enum([
  "regulatory_conflict",
  "ambiguous_worker_identity",
  "complex_support_requirement",
  "uncertain_entity_match",
  "stale_registration_signal",
  "consent_withdrawal_pending",
]);
export type HumanReviewReason = z.infer<typeof HumanReviewReasonSchema>;

export type ExplainableMatchCandidate = {
  candidateId: string;
  entityKind: "provider_outlet" | "care_worker" | "organisation";
  entityId: string;
  title: string;
  eligibilityPassed: boolean;
  preferenceScore: number | null;
  displayRank: number | null;
  explanation: {
    whyMayWork: string;
    confirmed: string[];
    unknown: string[];
    needsChecking: string[];
    whoMustConfirm: string;
  };
  claims: Claim[];
  humanReviewRequired: boolean;
  humanReviewReasons: HumanReviewReason[];
  provenance: Provenance[];
};

export type SupportIntelligenceDenied = {
  ok: false;
  reasonCode:
    | "feature_flag_disabled"
    | "kill_switch"
    | "consent_missing"
    | "consent_withdrawn"
    | "capability_disabled"
    | "operational_action_denied"
    | "rate_limited"
    | "validation_failed"
    | "human_review_required";
  message: string;
};

export type PaginationInput = {
  cursor?: string;
  limit?: number;
};

export type Paginated<T> = {
  items: T[];
  nextCursor: string | null;
  totalEstimate: number | null;
};
