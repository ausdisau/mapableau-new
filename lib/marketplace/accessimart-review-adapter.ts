/**
 * AccessiMart.zip review-only adapter (source snapshot supplied 2026-11-10).
 *
 * The uploaded app exposes unprotected admin/order APIs and seeds sellers as
 * "verified" without attributable evidence. Do NOT import the backend, checkout,
 * supplier trust label, price, ARTG assertion or funding claim into a live listing.
 *
 * This is a typed preparation boundary, not a database ingestion pipeline.
 */

export const ACCESSIMART_DRAFT_CATEGORIES = [
  { slug: "mobility-seating", label: "Mobility and seating" },
  { slug: "daily-living-aids", label: "Daily living aids" },
  { slug: "communication", label: "Communication and AAC" },
  { slug: "vision-blindness", label: "Vision and low-vision aids" },
  { slug: "hearing-deafness", label: "Hearing and Deaf access" },
  { slug: "home-modifications", label: "Home modifications" },
  { slug: "repair-maintenance", label: "Repair and maintenance" },
] as const;

export type AccessiMartDraftCategorySlug =
  (typeof ACCESSIMART_DRAFT_CATEGORIES)[number]["slug"];

export type AccessiMartCondition =
  | "new"
  | "refurbished"
  | "repair_service"
  | "spare_part"
  | "unknown";

export type AccessiMartEvidenceStatus =
  | "synthetic"
  | "unverified"
  | "seller-stated";

/**
 * Organisation-shaped supplier claims. These are not Organisation rows and
 * must not create a parallel source of truth. Seed "verified" is always discarded.
 */
export type AccessiMartSupplierClaim = {
  sourceSupplierId: string;
  legalName: string;
  tradingName: string | null;
  abn: string | null;
  website: string | null;
  serviceRegions: string | null;
  warrantyPolicy: string | null;
  repairPolicy: string | null;
  /** Always not-verified — seed verificationStatus is ignored. */
  identityAssurance: "not-verified";
};

export type AccessiMartReviewListing = {
  source: "user-supplied-accessimart-zip";
  sourceId: string;
  slug: string;
  name: string;
  description: string | null;
  categorySlug: AccessiMartDraftCategorySlug | "unknown";
  condition: AccessiMartCondition;
  quoteRequired: boolean;
  clinicalReviewRecommended: boolean;
  repairAvailable: boolean;
  sparePartsAvailable: boolean;
  setupComplexity: "simple" | "moderate" | "complex" | null;
  warrantyPeriod: string | null;
  safetyNotes: string | null;
  lastVerifiedAt: string | null;
  evidenceStatus: AccessiMartEvidenceStatus;
  sourceClaims: {
    intendedUse: string | null;
    accessNeed: string | null;
    supportCategory: string | null;
    tgaArtgStatus: string | null;
    ndisGuidance: string | null;
  };
  supplier: AccessiMartSupplierClaim | null;
  assurance: {
    supplierIdentity: "not-verified";
    productSafety: "not-verified";
    ndisEligibility: "not-assessed";
    provenance: "unreviewed-source" | "synthetic-fixture";
    warranty: "not-verified";
  };
  commerce: {
    checkoutAvailable: false;
    quoteSubmissionAvailable: false;
    sellerContactAvailable: false;
    illustrativePriceShown: false;
  };
};

const CONDITIONS = new Set([
  "new",
  "refurbished",
  "repair_service",
  "spare_part",
]);

const CATEGORY_SLUGS = new Set(
  ACCESSIMART_DRAFT_CATEGORIES.map((category) => category.slug),
);

const SETUP = new Set(["simple", "moderate", "complex"]);

function limitedText(value: unknown, maximum: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maximum) : null;
}

function asSourceId(value: unknown, slug: string): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(Math.trunc(value));
  }
  if (typeof value === "string" && value.trim()) {
    return value.trim().slice(0, 64);
  }
  return `slug:${slug}`;
}

function normaliseSupplier(value: unknown): AccessiMartSupplierClaim | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const row = value as Record<string, unknown>;
  const legalName = limitedText(row.legalName ?? row.tradingName, 160);
  if (!legalName) return null;
  const sourceSupplierId =
    typeof row.id === "number"
      ? String(Math.trunc(row.id))
      : limitedText(row.id, 64) ?? `supplier:${legalName.toLowerCase().replace(/\s+/g, "-").slice(0, 40)}`;

  return {
    sourceSupplierId,
    legalName,
    tradingName: limitedText(row.tradingName, 160),
    abn: limitedText(row.abn, 32),
    website: limitedText(row.website, 200),
    serviceRegions: limitedText(row.serviceRegions, 200),
    warrantyPolicy: limitedText(row.warrantyPolicy, 600),
    repairPolicy: limitedText(row.repairPolicy, 600),
    identityAssurance: "not-verified",
  };
}

/**
 * Manually reviewed source rows only. The result is suitable for internal
 * quality review, NOT public publication, recommendation or purchasing.
 */
export function normaliseAccessiMartProductForReview(
  source: unknown,
): AccessiMartReviewListing | null {
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return null;
  }
  const row = source as Record<string, unknown>;
  const slug = limitedText(row.slug, 80);
  const name = limitedText(row.name, 150);
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !name) {
    return null;
  }

  const rawCondition = limitedText(row.condition, 30);
  const condition: AccessiMartCondition =
    rawCondition && CONDITIONS.has(rawCondition)
      ? (rawCondition as AccessiMartCondition)
      : "unknown";

  const rawCategory = limitedText(row.categorySlug ?? row.category, 60);
  const categorySlug: AccessiMartReviewListing["categorySlug"] =
    rawCategory &&
    CATEGORY_SLUGS.has(rawCategory as AccessiMartDraftCategorySlug)
      ? (rawCategory as AccessiMartDraftCategorySlug)
      : "unknown";

  const rawSetup = limitedText(row.setupComplexity, 20);
  const setupComplexity =
    rawSetup && SETUP.has(rawSetup)
      ? (rawSetup as "simple" | "moderate" | "complex")
      : null;

  const provenance =
    row.fixtureProvenance === "synthetic-fixture"
      ? ("synthetic-fixture" as const)
      : ("unreviewed-source" as const);

  const evidenceStatus: AccessiMartEvidenceStatus =
    provenance === "synthetic-fixture"
      ? "synthetic"
      : row.evidenceStatus === "seller-stated"
        ? "seller-stated"
        : "unverified";

  return {
    source: "user-supplied-accessimart-zip",
    sourceId: asSourceId(row.id ?? row.sourceId, slug),
    slug,
    name,
    description: limitedText(row.description, 1500),
    categorySlug,
    condition,
    quoteRequired: row.quoteRequired === true,
    clinicalReviewRecommended: row.clinicalReviewRecommended === true,
    repairAvailable: row.repairAvailable === true,
    sparePartsAvailable: row.sparePartsAvailable === true,
    setupComplexity,
    warrantyPeriod: limitedText(row.warrantyPeriod, 160),
    safetyNotes: limitedText(row.safetyNotes, 800),
    lastVerifiedAt: limitedText(
      row.lastVerifiedAt ?? row.inspectionDate ?? row.createdAt,
      40,
    ),
    evidenceStatus,
    sourceClaims: {
      intendedUse: limitedText(row.intendedUse, 400),
      accessNeed: limitedText(row.accessNeed, 400),
      supportCategory: limitedText(row.supportCategory, 160),
      tgaArtgStatus: limitedText(row.tgaArtgStatus, 160),
      ndisGuidance: limitedText(row.ndisGuidance, 600),
    },
    supplier: normaliseSupplier(row.supplier),
    assurance: {
      supplierIdentity: "not-verified",
      productSafety: "not-verified",
      ndisEligibility: "not-assessed",
      provenance,
      warranty: "not-verified",
    },
    commerce: {
      checkoutAvailable: false,
      quoteSubmissionAvailable: false,
      sellerContactAvailable: false,
      illustrativePriceShown: false,
    },
  };
}
