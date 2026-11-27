/**
 * Care discovery OpenSearch index design (pilot).
 * Prisma remains source of truth. Ranking criteria are participant-selected;
 * never pay-to-rank or auto-assign.
 */

export const CARE_DISCOVERY_INDEX_V1 = "mapable_care_discovery_v1";
export const CARE_DISCOVERY_ALIAS = "mapable_care_discovery_current";

export type CareDiscoveryLane = "assured" | "choice" | "partner";

export const CARE_DISCOVERY_INDEX_BODY = {
  settings: {
    analysis: {
      analyzer: {
        care_discovery_text: {
          type: "custom",
          tokenizer: "standard",
          filter: ["lowercase", "asciifolding"],
        },
      },
    },
  },
  mappings: {
    properties: {
      candidateId: { type: "keyword" },
      candidateType: { type: "keyword" }, // worker | provider
      displayName: {
        type: "text",
        analyzer: "care_discovery_text",
        fields: { keyword: { type: "keyword" } },
      },
      publicClaims: { type: "text", analyzer: "care_discovery_text" },
      competencies: { type: "keyword" },
      serviceAreas: { type: "keyword" },
      suburb: { type: "keyword" },
      state: { type: "keyword" },
      postcode: { type: "keyword" },
      lane: { type: "keyword" }, // assured | choice | partner
      organisationId: { type: "keyword" },
      provenanceSource: { type: "keyword" },
      provenanceCheckedAt: { type: "date" },
      evidenceFreshnessDays: { type: "integer" },
      credentialStatus: { type: "keyword" },
      /** Never used for pay-to-rank — informational only. */
      sponsoredPlacement: { type: "boolean" },
      updatedAt: { type: "date" },
    },
  },
} as const;

export const CARE_DISCOVERY_SEARCH_FIELDS = [
  "displayName^3",
  "publicClaims^2",
  "competencies^2",
  "serviceAreas",
  "suburb",
  "postcode",
];

export type CareDiscoveryDocument = {
  candidateId: string;
  candidateType: "worker" | "provider";
  displayName: string;
  publicClaims: string;
  competencies: string[];
  serviceAreas: string[];
  suburb?: string;
  state?: string;
  postcode?: string;
  lane: CareDiscoveryLane;
  organisationId?: string;
  provenanceSource: string;
  provenanceCheckedAt: string;
  evidenceFreshnessDays: number;
  credentialStatus: "current" | "expiring" | "unknown" | "blocked";
  sponsoredPlacement: false;
  updatedAt: string;
};
