/**
 * Versioned CripSquare ↔ MapAble integration contract (boundary only).
 *
 * No posts, DMs, friendships, diagnosis details or memberships are imported.
 */

export const CRIPSQUARE_INTEGRATION_CONTRACT_VERSION = "2026-11-10.1" as const;

export type CripSquareReferenceKind =
  | "marketplace-listing"
  | "access-challenge"
  | "place-observation"
  | "provider-directory-entry";

/**
 * Future moderated discussion may *reference* a MapAble record by id only.
 * MapAble never copies CripSquare private content into Core by default.
 */
export type CripSquareListingReference = {
  readonly contractVersion: typeof CRIPSQUARE_INTEGRATION_CONTRACT_VERSION;
  readonly kind: CripSquareReferenceKind;
  readonly mapableRecordId: string;
  readonly displayTitle: string;
  readonly evidenceStatus: "unverified" | "moderated" | "official" | "synthetic";
  /** Community participation is never required for Care/Transport/Employment/Marketplace. */
  readonly requiredForCoreServices: false;
  readonly importsPrivateContent: false;
  readonly convertsRecommendationToSellerEndorsement: false;
};

export type CripSquareBoundaryPolicy = {
  readonly contractVersion: typeof CRIPSQUARE_INTEGRATION_CONTRACT_VERSION;
  readonly federationEnabled: false;
  readonly mayReferenceMapAbleRecords: true;
  readonly mayImportPosts: false;
  readonly mayImportDirectMessages: false;
  readonly mayImportFriendships: false;
  readonly mayImportDiagnosis: false;
  readonly mayImportMemberships: false;
  readonly communityPrerequisiteForCoreServices: false;
  readonly sellerEndorsementFromForum: false;
};

export const CRIPSQUARE_BOUNDARY_POLICY: CripSquareBoundaryPolicy = {
  contractVersion: CRIPSQUARE_INTEGRATION_CONTRACT_VERSION,
  federationEnabled: false,
  mayReferenceMapAbleRecords: true,
  mayImportPosts: false,
  mayImportDirectMessages: false,
  mayImportFriendships: false,
  mayImportDiagnosis: false,
  mayImportMemberships: false,
  communityPrerequisiteForCoreServices: false,
  sellerEndorsementFromForum: false,
};

export function createCripSquareListingReference(input: {
  kind: CripSquareReferenceKind;
  mapableRecordId: string;
  displayTitle: string;
  evidenceStatus: CripSquareListingReference["evidenceStatus"];
}): CripSquareListingReference {
  return {
    contractVersion: CRIPSQUARE_INTEGRATION_CONTRACT_VERSION,
    kind: input.kind,
    mapableRecordId: input.mapableRecordId.trim(),
    displayTitle: input.displayTitle.trim().slice(0, 200),
    evidenceStatus: input.evidenceStatus,
    requiredForCoreServices: false,
    importsPrivateContent: false,
    convertsRecommendationToSellerEndorsement: false,
  };
}
