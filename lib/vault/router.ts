import { getTaxonomyEntry } from "@/lib/vault/taxonomy";
import type { VaultCanonicalRouteDecision } from "@/lib/vault/types";

export type RouteInput = {
  itemType: string;
  canonicalRecordId?: string;
  /** Optional hint only — never overrides taxonomy domain. */
  suggestedDomain?: string;
};

/**
 * Deterministic Canonical Data Router.
 * The model cannot choose the canonical domain.
 */
export function decideCanonicalRoute(
  input: RouteInput
): VaultCanonicalRouteDecision {
  const entry = getTaxonomyEntry(input.itemType);

  if (!entry) {
    return {
      itemType: input.itemType,
      canonicalDomain: "unknown",
      canonicalRecordId: input.canonicalRecordId,
      vaultTreatment: "not_permitted",
      classification: "security_restricted",
      category: "portability",
      reasons: [
        `Unknown item type "${input.itemType}" is not in the frozen Vault taxonomy.`,
        "Human review required before any Vault indexing.",
      ],
      participantReviewRequired: true,
      humanReviewRequired: true,
      fieldManifest: [],
    };
  }

  if (
    input.suggestedDomain &&
    input.suggestedDomain !== entry.canonicalDomain
  ) {
    return {
      itemType: entry.itemType,
      canonicalDomain: entry.canonicalDomain,
      canonicalRecordId: input.canonicalRecordId,
      vaultTreatment: "not_permitted",
      classification: entry.defaultClassification,
      category: entry.category,
      reasons: [
        `Suggested domain "${input.suggestedDomain}" conflicts with frozen taxonomy domain "${entry.canonicalDomain}".`,
        "Canonical domain is taxonomy-owned and cannot be overridden.",
      ],
      participantReviewRequired: true,
      humanReviewRequired: true,
      fieldManifest: entry.fieldManifest,
    };
  }

  const reasons = [
    `Routed to ${entry.canonicalOwnerLabel}.`,
    `Vault treatment: ${entry.defaultTreatment}.`,
  ];

  if (entry.defaultTreatment === "reference_only") {
    reasons.push(
      "Vault indexes a reference only; canonical system remains the editable source of truth."
    );
  }

  if (entry.defaultTreatment === "not_permitted") {
    reasons.push("Item must not be stored or copied into the Vault.");
  }

  return {
    itemType: entry.itemType,
    canonicalDomain: entry.canonicalDomain,
    canonicalRecordId: input.canonicalRecordId,
    vaultTreatment: entry.defaultTreatment,
    classification: entry.defaultClassification,
    category: entry.category,
    reasons,
    participantReviewRequired: entry.humanReviewRequired,
    humanReviewRequired: entry.humanReviewRequired,
    fieldManifest: entry.fieldManifest,
  };
}

/** Convenience aliases used by sync/backfill. */
export const ROUTABLE_PROFILE_TYPES = [
  "accessibility_profile",
  "access_passport",
  "aura_memory_card",
  "visit_plan",
  "offline_visit_pack",
  "equipment_passport",
  "consent_record",
  "document",
  "trusted_contact",
] as const;
