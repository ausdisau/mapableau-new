import type { AccessOntologyConcept } from "./types";

const V = "2.0.0";

function concept(
  partial: Omit<AccessOntologyConcept, "version"> & { version?: string },
): AccessOntologyConcept {
  return { version: V, ...partial };
}

/**
 * Narrow ontology additions required to represent National Public Toilet Map
 * attributes without collapsing them into a single "accessible" boolean.
 *
 * `changing_places` intentionally overrides the broader seed-v2 wording so a
 * generic adult-change facility can never be presented as Changing Places
 * certified solely because the two concepts were previously conflated.
 */
export const NPTM_ONTOLOGY_CONCEPTS: AccessOntologyConcept[] = [
  concept({
    id: "self_care_continence.ambulant_toilet",
    domain: "self_care_continence",
    definition: "An ambulant toilet facility is recorded as available.",
    dataType: "boolean",
    unit: null,
    evidenceRequirements: ["facility_listing_or_observation"],
    personalFitBehaviour: "hard_constraint_when_required",
    standardsMappings: ["AS1428.1:sanitary"],
    permittedInference: [],
    prohibitedInference: ["infer_from_accessible_toilet_alone"],
    reviewOwner: "access-infrastructure",
    deprecationPathway: null,
    defaultFreshnessDays: 180,
  }),
  concept({
    id: "self_care_continence.left_hand_transfer",
    domain: "self_care_continence",
    definition: "The accessible toilet is recorded with left-hand transfer/rail configuration.",
    dataType: "boolean",
    unit: null,
    evidenceRequirements: ["facility_listing_or_observation"],
    personalFitBehaviour: "hard_constraint_when_required",
    standardsMappings: ["AS1428.1:sanitary"],
    permittedInference: [],
    prohibitedInference: ["infer_from_accessible_toilet_alone"],
    reviewOwner: "access-infrastructure",
    deprecationPathway: null,
    defaultFreshnessDays: 180,
  }),
  concept({
    id: "self_care_continence.right_hand_transfer",
    domain: "self_care_continence",
    definition: "The accessible toilet is recorded with right-hand transfer/rail configuration.",
    dataType: "boolean",
    unit: null,
    evidenceRequirements: ["facility_listing_or_observation"],
    personalFitBehaviour: "hard_constraint_when_required",
    standardsMappings: ["AS1428.1:sanitary"],
    permittedInference: [],
    prohibitedInference: ["infer_from_accessible_toilet_alone"],
    reviewOwner: "access-infrastructure",
    deprecationPathway: null,
    defaultFreshnessDays: 180,
  }),
  concept({
    id: "self_care_continence.adult_change",
    domain: "self_care_continence",
    definition: "An adult change facility is recorded as available; this does not by itself mean Changing Places certified.",
    dataType: "boolean",
    unit: null,
    evidenceRequirements: ["facility_listing_or_observation"],
    personalFitBehaviour: "hard_constraint_when_required",
    standardsMappings: [],
    permittedInference: [],
    prohibitedInference: ["unverified_changing_places_certified_inference"],
    reviewOwner: "access-infrastructure",
    deprecationPathway: null,
    defaultFreshnessDays: 365,
  }),
  concept({
    id: "self_care_continence.changing_places",
    domain: "self_care_continence",
    definition: "The facility is recorded as Changing Places certified or registered by the authoritative source.",
    dataType: "boolean",
    unit: null,
    evidenceRequirements: ["authoritative_certification_or_registry_listing"],
    personalFitBehaviour: "hard_constraint_when_required",
    standardsMappings: [],
    permittedInference: [],
    prohibitedInference: [
      "unverified_changing_places_certified_from_adult_change",
      "infer_from_accessible_toilet_alone",
    ],
    reviewOwner: "access-infrastructure",
    deprecationPathway: null,
    defaultFreshnessDays: 365,
  }),
  concept({
    id: "self_care_continence.mlak_required_24h",
    domain: "self_care_continence",
    definition: "A Master Locksmiths Access Key (MLAK) is recorded as required to access the facility at any time.",
    dataType: "boolean",
    unit: null,
    evidenceRequirements: ["facility_listing_or_observation"],
    personalFitBehaviour: "hard_constraint_when_required",
    standardsMappings: [],
    permittedInference: [],
    prohibitedInference: ["unverified_user_mlak_possession"],
    reviewOwner: "access-infrastructure",
    deprecationPathway: null,
    defaultFreshnessDays: 180,
  }),
  concept({
    id: "self_care_continence.mlak_after_hours_access",
    domain: "self_care_continence",
    definition: "NPTM positively records an MLAK after-hours access condition. Official NPTM documentation differs on whether this means MLAK is required after hours or can be used after scheduled hours, so MapAble preserves the source assertion without choosing either interpretation.",
    dataType: "boolean",
    unit: null,
    evidenceRequirements: ["facility_listing_or_observation"],
    personalFitBehaviour: "evidence_freshness_gate",
    standardsMappings: [],
    permittedInference: ["mlak_relevant_to_after_hours_access"],
    prohibitedInference: [
      "unverified_mlak_after_hours_required_inference",
      "unverified_mlak_after_hours_optional_inference",
      "treat_unverified_false_as_no_mlak_after_hours_access",
    ],
    reviewOwner: "access-infrastructure",
    deprecationPathway: null,
    defaultFreshnessDays: 90,
  }),
  concept({
    id: "self_care_continence.opening_hours",
    domain: "self_care_continence",
    definition: "Publisher-supplied opening/access hours for the toilet facility.",
    dataType: "text",
    unit: null,
    evidenceRequirements: ["operator_or_facility_listing"],
    personalFitBehaviour: "evidence_freshness_gate",
    standardsMappings: [],
    permittedInference: ["availability_within_stated_hours"],
    prohibitedInference: [
      "assume_always_open_outside_stated_hours",
      "unverified_current_opening_hours",
    ],
    reviewOwner: "access-infrastructure",
    deprecationPathway: null,
    defaultFreshnessDays: 30,
  }),
  concept({
    id: "self_care_continence.access_information",
    domain: "self_care_continence",
    definition: "Human-readable access instructions or qualifications supplied for the facility.",
    dataType: "text",
    unit: null,
    evidenceRequirements: ["operator_or_facility_listing"],
    personalFitBehaviour: "informational",
    standardsMappings: [],
    permittedInference: [],
    prohibitedInference: ["unverified_free_text_access_guarantee"],
    reviewOwner: "access-infrastructure",
    deprecationPathway: null,
    defaultFreshnessDays: 90,
  }),
];

const byId = new Map(NPTM_ONTOLOGY_CONCEPTS.map((item) => [item.id, item]));

export function getNptmOntologyConcept(
  id: string,
): AccessOntologyConcept | undefined {
  return byId.get(id);
}
