/**
 * Synthetic AccessiMart-by-MapAble catalogue fixtures.
 *
 * Shapes follow the uploaded AccessiMart seed (IDs/slugs preserved where
 * possible). Legal/trading names are fictionalised. All assurance is
 * not-verified. No prices, images, dropshipping or contacts are purchasable.
 */

import {
  normaliseAccessiMartProductForReview,
  type AccessiMartReviewListing,
} from "@/lib/marketplace/accessimart-review-adapter";

type RawFixture = Record<string, unknown>;

const SYNTHETIC_SUPPLIERS: Record<string, RawFixture> = {
  "1": {
    id: 1,
    legalName: "Southern Access Equipment Co-op Ltd",
    tradingName: "Southern Access Equipment",
    abn: null,
    website: null,
    serviceRegions: "Illustrative — Australia-wide claim unverified",
    warrantyPolicy: "Seller-stated 12-month example warranty — not verified",
    repairPolicy: "Seller-stated repair referral — not verified",
    verificationStatus: "verified",
  },
  "2": {
    id: 2,
    legalName: "Harbour Daily Living Supplies Pty Ltd",
    tradingName: "Harbour Daily Living",
    abn: null,
    website: null,
    serviceRegions: "Illustrative — NSW/VIC claim unverified",
    warrantyPolicy: "Seller-stated warranty — not verified",
    repairPolicy: "Seller-stated repair pathway — not verified",
    verificationStatus: "verified",
  },
  "3": {
    id: 3,
    legalName: "Plain Speech Communication Aids Ltd",
    tradingName: "Plain Speech Aids",
    abn: null,
    website: null,
    serviceRegions: "Illustrative — metro claim unverified",
    warrantyPolicy: "Manufacturer warranty claim — not verified",
    repairPolicy: "Technical support claim — not verified",
    verificationStatus: "verified",
  },
};

/**
 * Curated subset derived from AccessiMart seed shapes.
 * Source numeric IDs and slugs preserved; brand/legal names fictionalised.
 */
const RAW_FIXTURES: readonly RawFixture[] = [
  {
    id: 1,
    slug: "karma-ergo-lite-2-manual-wheelchair",
    name: "Lightweight folding manual wheelchair (example)",
    description:
      "Illustrative ultra-lightweight folding wheelchair for community and indoor use. Dimensions, weight capacity and suitability are unverified.",
    categorySlug: "mobility-seating",
    condition: "new",
    quoteRequired: false,
    clinicalReviewRecommended: true,
    intendedUse: "Community and indoor mobility example",
    accessNeed: "Mobility impairment",
    supportCategory: "Mobility equipment",
    setupComplexity: "simple",
    repairAvailable: true,
    sparePartsAvailable: true,
    warrantyPeriod: "12 months (seller-stated)",
    tgaArtgStatus: "Seller-stated ARTG claim — not independently verified",
    ndisGuidance:
      "May relate to assistive technology discussions — not an eligibility or funding determination.",
    safetyNotes: null,
    lastVerifiedAt: "2026-05-30",
    fixtureProvenance: "synthetic-fixture",
    supplier: SYNTHETIC_SUPPLIERS["1"],
  },
  {
    id: 2,
    slug: "permobil-m3-corpus-powered-wheelchair",
    name: "Powered wheelchair with tilt options (example)",
    description:
      "Illustrative powered wheelchair requiring specialist assessment. Not available for enquiry or purchase in this review slice.",
    categorySlug: "mobility-seating",
    condition: "new",
    quoteRequired: true,
    clinicalReviewRecommended: true,
    intendedUse: "Full-time powered mobility example",
    accessNeed: "Severe mobility impairment",
    supportCategory: "Mobility equipment",
    setupComplexity: "complex",
    repairAvailable: true,
    sparePartsAvailable: true,
    warrantyPeriod: "Seller-stated electronics/frame warranty — not verified",
    tgaArtgStatus: "Seller-stated ARTG claim — not independently verified",
    ndisGuidance:
      "High-cost AT discussions require assessment — MapAble does not approve funding.",
    safetyNotes:
      "Professional setup and training claimed by seller — not verified. Restricted in this review storefront.",
    lastVerifiedAt: "2026-05-30",
    fixtureProvenance: "synthetic-fixture",
    supplier: SYNTHETIC_SUPPLIERS["1"],
  },
  {
    id: 6,
    slug: "helping-hand-reacher",
    name: "Long-handled reacher (example)",
    description:
      "Illustrative everyday living reacher. Grip force and safe use are unverified.",
    categorySlug: "daily-living-aids",
    condition: "new",
    quoteRequired: false,
    clinicalReviewRecommended: false,
    intendedUse: "Reach and grasp support example",
    accessNeed: "Limited reach or grip",
    supportCategory: "Daily living",
    setupComplexity: "simple",
    repairAvailable: false,
    sparePartsAvailable: false,
    warrantyPeriod: "90 days (seller-stated)",
    tgaArtgStatus: null,
    ndisGuidance: "Informational only — not assessed for any individual plan.",
    safetyNotes: null,
    lastVerifiedAt: "2026-05-30",
    fixtureProvenance: "synthetic-fixture",
    supplier: SYNTHETIC_SUPPLIERS["2"],
  },
  {
    id: 8,
    slug: "tobii-td-snap-licence",
    name: "AAC communication board pack (example)",
    description:
      "Illustrative low/high-tech AAC vocabulary pack. Language suitability is not assessed.",
    categorySlug: "communication",
    condition: "new",
    quoteRequired: false,
    clinicalReviewRecommended: true,
    intendedUse: "Communication access example",
    accessNeed: "Complex communication needs",
    supportCategory: "Communication",
    setupComplexity: "moderate",
    repairAvailable: false,
    sparePartsAvailable: false,
    warrantyPeriod: "Licence terms seller-stated — not verified",
    tgaArtgStatus: null,
    ndisGuidance: "Speech pathology input may be relevant — not determined here.",
    safetyNotes: null,
    lastVerifiedAt: "2026-05-30",
    fixtureProvenance: "synthetic-fixture",
    supplier: SYNTHETIC_SUPPLIERS["3"],
  },
  {
    id: 11,
    slug: "modular-threshold-ramp",
    name: "Modular threshold ramp (example)",
    description:
      "Illustrative modular threshold ramp. Gradients, load ratings and installation are unverified.",
    categorySlug: "home-modifications",
    condition: "new",
    quoteRequired: false,
    clinicalReviewRecommended: false,
    intendedUse: "Door threshold access example",
    accessNeed: "Step-free access",
    supportCategory: "Home modifications",
    setupComplexity: "moderate",
    repairAvailable: true,
    sparePartsAvailable: true,
    warrantyPeriod: "12 months (seller-stated)",
    tgaArtgStatus: null,
    ndisGuidance: "Home modification rules are external — not assessed here.",
    safetyNotes: "Installation and load capacity unverified.",
    lastVerifiedAt: "2026-05-30",
    fixtureProvenance: "synthetic-fixture",
    supplier: SYNTHETIC_SUPPLIERS["1"],
  },
  {
    id: 12,
    slug: "wheelchair-service-inspection",
    name: "Wheelchair service inspection (example)",
    description:
      "Illustrative repair/maintenance service listing. No booking or quote submission in this slice.",
    categorySlug: "repair-maintenance",
    condition: "repair_service",
    quoteRequired: true,
    clinicalReviewRecommended: false,
    intendedUse: "Equipment maintenance example",
    accessNeed: "Mobility equipment continuity",
    supportCategory: "Repair",
    setupComplexity: null,
    repairAvailable: true,
    sparePartsAvailable: true,
    warrantyPeriod: null,
    tgaArtgStatus: null,
    ndisGuidance: "Repair funding is not determined by MapAble.",
    safetyNotes: null,
    lastVerifiedAt: "2026-05-30",
    fixtureProvenance: "synthetic-fixture",
    supplier: SYNTHETIC_SUPPLIERS["1"],
  },
];

function buildCatalogue(): readonly AccessiMartReviewListing[] {
  const listings: AccessiMartReviewListing[] = [];
  for (const raw of RAW_FIXTURES) {
    const listing = normaliseAccessiMartProductForReview(raw);
    if (listing) listings.push(listing);
  }
  return listings;
}

export const ACCESSIMART_SYNTHETIC_CATALOGUE: readonly AccessiMartReviewListing[] =
  buildCatalogue();

export function listAccessiMartReviewListings(options?: {
  search?: string;
  categorySlug?: string;
  condition?: string;
}): readonly AccessiMartReviewListing[] {
  const search = options?.search?.trim().toLocaleLowerCase("en-AU") ?? "";
  const categorySlug = options?.categorySlug?.trim() ?? "";
  const condition = options?.condition?.trim() ?? "";

  return ACCESSIMART_SYNTHETIC_CATALOGUE.filter((listing) => {
    if (categorySlug && categorySlug !== "all" && listing.categorySlug !== categorySlug) {
      return false;
    }
    if (condition && condition !== "all" && listing.condition !== condition) {
      return false;
    }
    if (!search) return true;
    const haystack = [
      listing.name,
      listing.description ?? "",
      listing.sourceClaims.accessNeed ?? "",
      listing.sourceClaims.intendedUse ?? "",
      listing.supplier?.tradingName ?? "",
      listing.supplier?.legalName ?? "",
    ]
      .join(" ")
      .toLocaleLowerCase("en-AU");
    return haystack.includes(search);
  });
}

export function getAccessiMartReviewListing(
  slug: string,
): AccessiMartReviewListing | null {
  return (
    ACCESSIMART_SYNTHETIC_CATALOGUE.find((listing) => listing.slug === slug) ??
    null
  );
}
