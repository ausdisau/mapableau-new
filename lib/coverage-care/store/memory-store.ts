import { COVERAGE_CARE_BRAND } from "@/lib/coverage-care/brand";
import type {
  CoverageCareAccessDenial,
  CoverageCareBrandContentItem,
  CoverageCareEnquiry,
  CoverageCareProvisionCheck,
  CoverageCareServiceListing,
  CoverageCareTenantRecord,
} from "@/lib/coverage-care/types";
import {
  ACME_CARE_TENANT_SLUG,
  COVERAGE_CARE_TENANT_SLUG,
} from "@/lib/coverage-care/types";

function nowIso() {
  return new Date().toISOString();
}

function id(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

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
}

function seedState(): CoverageCareMemoryState {
  const coverageTenantId = "tenant_coverage_care";
  const acmeTenantId = "tenant_acme_care";
  const ts = nowIso();

  const listings: CoverageCareServiceListing[] = [
    {
      id: "listing_cc_ot",
      tenantId: coverageTenantId,
      title: "Community Occupational Therapy (demo)",
      discipline: "Occupational Therapy",
      region: "Greater Sydney (synthetic)",
      accessibilityNotes:
        "Wheelchair-accessible clinic rooms. AAC-friendly communication available on request.",
      summary:
        "Synthetic allied-health listing for Coverage Care pilot exploration. Not a live provider.",
      provenance: "synthetic_demo",
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: "listing_cc_speech",
      tenantId: coverageTenantId,
      title: "Speech Pathology — home & telehealth (demo)",
      discipline: "Speech Pathology",
      region: "Illawarra (synthetic)",
      accessibilityNotes:
        "Telehealth and home-visit options. Easy-read materials available.",
      summary:
        "Demo speech pathology directory entry. Availability and registration are not verified.",
      provenance: "synthetic_demo",
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: "listing_cc_physio",
      tenantId: coverageTenantId,
      title: "Physiotherapy & mobility support (demo)",
      discipline: "Physiotherapy",
      region: "Hunter (synthetic)",
      accessibilityNotes:
        "Step-free entry. Quiet waiting room option.",
      summary:
        "Synthetic physiotherapy listing. Do not treat as confirmed NDIS registration.",
      provenance: "synthetic_demo",
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: "listing_acme_ot",
      tenantId: acmeTenantId,
      title: "Acme OT (other tenant — isolation fixture)",
      discipline: "Occupational Therapy",
      region: "Melbourne (synthetic)",
      accessibilityNotes: "Isolation test fixture only.",
      summary: "Belongs to fictional second tenant acme-care.",
      provenance: "synthetic_demo",
      createdAt: ts,
      updatedAt: ts,
    },
  ];

  return {
    tenants: [
      {
        id: coverageTenantId,
        slug: COVERAGE_CARE_TENANT_SLUG,
        name: COVERAGE_CARE_BRAND.name,
        organisationId: "org_coverage_care",
      },
      {
        id: acmeTenantId,
        slug: ACME_CARE_TENANT_SLUG,
        name: "Acme Care (fictional isolation tenant)",
        organisationId: "org_acme_care",
      },
    ],
    listings,
    enquiries: [],
    brandItems: [
      {
        id: "brand_msg_1",
        tenantId: coverageTenantId,
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
        tenantId: coverageTenantId,
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
      [coverageTenantId]: {
        tagline: COVERAGE_CARE_BRAND.tagline,
        values: [...COVERAGE_CARE_BRAND.values],
        approvalStatus: "approved",
      },
    },
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
