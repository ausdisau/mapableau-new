import { LISTING_PUBLICATION_STATUS } from "@/lib/tenancy/coverage-care-brand";
import type {
  CommunicationChannel,
  EnquirySharePreview,
  ParticipantEnquiryStatus,
  ProviderInboxStatus,
} from "@/lib/tenancy/tenant-enquiry-model";

export const COVERAGE_CARE_TENANT_SLUG = "coveragecare" as const;
export const ACME_CARE_TENANT_SLUG = "acme-care" as const;

export type CoverageCareEnquiryStatus = ParticipantEnquiryStatus;
export type CoverageCareProviderStatus = ProviderInboxStatus;
export type CoverageCareSharePreview = EnquirySharePreview;
export type CoverageCareCommunicationChannel = CommunicationChannel;

export const COVERAGE_CARE_LISTING_PROVENANCES = [
  "synthetic_demo",
] as const;

export type CoverageCareListingProvenance =
  (typeof COVERAGE_CARE_LISTING_PROVENANCES)[number];

export const COVERAGE_CARE_PUBLICATION_STATUS = LISTING_PUBLICATION_STATUS;

export const COVERAGE_CARE_BRAND_APPROVAL_STATUSES = [
  "draft",
  "pending_approval",
  "approved",
  "rejected",
] as const;

export type CoverageCareBrandApprovalStatus =
  (typeof COVERAGE_CARE_BRAND_APPROVAL_STATUSES)[number];

export const COVERAGE_CARE_CONTENT_KINDS = [
  "messaging",
  "brand_asset",
  "page_copy",
] as const;

export type CoverageCareContentKind =
  (typeof COVERAGE_CARE_CONTENT_KINDS)[number];

export interface CoverageCareBrandKit {
  name: string;
  tagline: string;
  sage: string;
  olive: string;
  values: readonly string[];
}

export interface CoverageCareServiceListing {
  id: string;
  tenantId: string;
  title: string;
  discipline: string;
  region: string;
  accessibilityNotes: string;
  summary: string;
  provenance: CoverageCareListingProvenance;
  publicationStatus: typeof LISTING_PUBLICATION_STATUS;
  createdAt: string;
  updatedAt: string;
}

export interface CoverageCareEnquiry {
  id: string;
  tenantId: string;
  participantUserId: string;
  listingId: string | null;
  status: CoverageCareEnquiryStatus;
  providerStatus: CoverageCareProviderStatus | null;
  sharePreview: CoverageCareSharePreview | null;
  consentRecordId: string | null;
  providerNotes: string | null;
  providerReply: string | null;
  responderLabel: string | null;
  withdrawnAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CoverageCareBrandContentItem {
  id: string;
  tenantId: string;
  kind: CoverageCareContentKind;
  title: string;
  body: string;
  approvalStatus: CoverageCareBrandApprovalStatus;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  reviewedByUserId: string | null;
}

export interface CoverageCareProvisionCheck {
  id: string;
  tenantId: string;
  checkCode: string;
  label: string;
  status: "pass" | "fail" | "blocked" | "not_run" | "not_configured";
  detail: string;
  ranAt: string;
}

export interface CoverageCareTenantRecord {
  id: string;
  slug: string;
  name: string;
  organisationId: string;
}

export interface CoverageCareAccessDenial {
  id: string;
  actorUserId: string;
  attemptedTenantId: string;
  resourceType: string;
  resourceId?: string;
  reason: "TENANT_CONTEXT_REQUIRED" | "TENANT_MISMATCH" | "CROSS_TENANT_DENIED";
  createdAt: string;
}

export interface SyntheticDelegateGrant {
  id: string;
  participantUserId: string;
  delegateUserId: string;
  scope: string;
  expiresAt: string;
  revokedAt: string | null;
}
