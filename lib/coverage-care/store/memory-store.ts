import type {
  CoverageCareAccessDenial,
  CoverageCareBrandContentItem,
  CoverageCareEnquiry,
  CoverageCareProvisionCheck,
  CoverageCareServiceListing,
  CoverageCareTenantRecord,
  SyntheticDelegateGrant,
} from "@/lib/coverage-care/types";
import {
  COVERAGE_CARE_BRAND,
  COVERAGE_CARE_PROPOSED_DISCIPLINES,
  LISTING_PUBLICATION_STATUS,
} from "@/lib/tenancy/coverage-care-brand";
import {
  getAcmeCareRegisteredTenant,
  getCoverageCareRegisteredTenant,
} from "@/lib/tenancy/tenant-registry";

function nowIso() {
  return new Date().toISOString();
}

function id(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

const REGION_CYCLE = [
  "Greater Sydney (synthetic)",
  "Illawarra (synthetic)",
  "Hunter (synthetic)",
  "ACT (synthetic)",
  "South East Queensland (synthetic)",
] as const;

export interface CoverageCareMemoryState {
  tenants: CoverageCareTenantRecord[];
  listings: CoverageCareServiceListing[];
  enquiries: CoverageCareEnquiry[];
  brandItems: CoverageCareBrandContentItem[];
  provisionChecks: CoverageCareProvisionCheck[];
  denials: CoverageCareAccessDenial[];
  brandMessaging: Record<
    string,
    { tagline: string; values: string[]; approvalStatus: string }
  >;
  delegates: SyntheticDelegateGrant[];
}

function seedListings(coverageTenantId: string, acmeTenantId: string, ts: string) {
  const listings: CoverageCareServiceListing[] = COVERAGE_CARE_PROPOSED_DISCIPLINES.map(
    (discipline, index) => ({
      id: `listing_cc_${index + 1}`,
      tenantId: coverageTenantId,
      title: `${discipline} (proposed)`,
      discipline,
      region: REGION_CYCLE[index % REGION_CYCLE.length]!,
      accessibilityNotes:
        "Access details awaiting verification. AAC-friendly and step-free options may be available after verification.",
      summary: `Proposed ${discipline} listing for Coverage Care pilot exploration. Not a live provider. Availability, practitioners and registration are not verified.`,
      provenance: "synthetic_demo",
      publicationStatus: LISTING_PUBLICATION_STATUS,
      createdAt: ts,
      updatedAt: ts,
    }),
  );

  listings.push({
    id: "listing_acme_ot",
    tenantId: acmeTenantId,
    title: "Acme OT (other tenant — isolation fixture)",
    discipline: "Occupational Therapy",
    region: "Melbourne (synthetic)",
    accessibilityNotes: "Isolation test fixture only.",
    summary: "Belongs to fictional second tenant acme-care.",
    provenance: "synthetic_demo",
    publicationStatus: LISTING_PUBLICATION_STATUS,
    createdAt: ts,
    updatedAt: ts,
  });

  return listings;
}

function seedState(): CoverageCareMemoryState {
  const coverage = getCoverageCareRegisteredTenant();
  const acme = getAcmeCareRegisteredTenant();
  const ts = nowIso();

  return {
    tenants: [
      {
        id: coverage.id,
        slug: coverage.slug,
        name: coverage.name,
        organisationId: coverage.organisationId,
      },
      {
        id: acme.id,
        slug: acme.slug,
        name: acme.name,
        organisationId: acme.organisationId,
      },
    ],
    listings: seedListings(coverage.id, acme.id, ts),
    enquiries: [],
    brandItems: [
      {
        id: "brand_msg_1",
        tenantId: coverage.id,
        kind: "messaging",
        title: "Homepage welcome",
        body: COVERAGE_CARE_BRAND.tagline,
        approvalStatus: "approved",
        createdAt: ts,
        updatedAt: ts,
        reviewedAt: ts,
        reviewedByUserId: null,
      },
      {
        id: "brand_asset_1",
        tenantId: coverage.id,
        kind: "brand_asset",
        title: "Organic wave wordmark",
        body: "svg:coverage-care-wave",
        approvalStatus: "pending_approval",
        createdAt: ts,
        updatedAt: ts,
        reviewedAt: null,
        reviewedByUserId: null,
      },
    ],
    provisionChecks: [],
    denials: [],
    brandMessaging: {
      [coverage.id]: {
        tagline: COVERAGE_CARE_BRAND.tagline,
        values: [...COVERAGE_CARE_BRAND.values],
        approvalStatus: "approved",
      },
    },
    delegates: [
      {
        id: "delegate_cc_demo",
        participantUserId: "user_cc_participant_demo",
        delegateUserId: "user_cc_delegate_demo",
        scope: "enquiry.assist_text_only",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        revokedAt: null,
      },
    ],
  };
}

let state: CoverageCareMemoryState = seedState();

export function getCoverageCareMemoryState(): CoverageCareMemoryState {
  return state;
}

export function resetCoverageCareMemoryStore() {
  state = seedState();
}

export function memoryCreateId(prefix: string) {
  return id(prefix);
}

export function memoryNow() {
  return nowIso();
}
