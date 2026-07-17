export type PublicDisclosureItem = {
  key: string;
  public: boolean;
  reason: string;
};

export function classifyWorkerTrustForPublicDisclosure(params: {
  eligibilityStatus: string;
  hasIdentityDocuments: boolean;
}): PublicDisclosureItem[] {
  return [
    {
      key: "eligibility_status_aggregate",
      public: true,
      reason: "Aggregate eligibility state may be shown to authorised org admins.",
    },
    {
      key: "identity_documents",
      public: false,
      reason: "Identity documents must never be exposed via public or generic APIs.",
    },
    {
      key: "raw_banning_payload",
      public: false,
      reason: "Banning-order raw payloads are not disclosed.",
    },
    {
      key: "pending_clearance_as_eligible",
      public: false,
      reason: `Status ${params.eligibilityStatus} must not be disclosed as eligible.`,
    },
    {
      key: "has_identity_docs_flag",
      public: false,
      reason: params.hasIdentityDocuments
        ? "Presence of identity docs is sensitive."
        : "No identity docs flag.",
    },
  ];
}
