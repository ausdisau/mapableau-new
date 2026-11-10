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

export type AccessiMartReviewListing = {
  source: "user-supplied-accessimart-zip";
  slug: string;
  name: string;
  description: string | null;
  condition: "new" | "refurbished" | "repair_service" | "spare_part" | "unknown";
  quoteRequired: boolean;
  clinicalReviewRecommended: boolean;
  repairAvailable: boolean;
  sparePartsAvailable: boolean;
  sourceClaims: {
    intendedUse: string | null;
    accessNeed: string | null;
    tgaArtgStatus: string | null;
    ndisGuidance: string | null;
  };
  assurance: {
    supplierIdentity: "not-verified";
    productSafety: "not-verified";
    ndisEligibility: "not-assessed";
    provenance: "unreviewed-source";
  };
  commerce: {
    checkoutAvailable: false;
    quoteSubmissionAvailable: false;
    sellerContactAvailable: false;
  };
};

const CONDITIONS = new Set(["new", "refurbished", "repair_service", "spare_part"]);

function limitedText(value: unknown, maximum: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maximum) : null;
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
  const condition =
    rawCondition && CONDITIONS.has(rawCondition)
      ? (rawCondition as AccessiMartReviewListing["condition"])
      : "unknown";

  return {
    source: "user-supplied-accessimart-zip",
    slug,
    name,
    description: limitedText(row.description, 1500),
    condition,
    quoteRequired: row.quoteRequired === true,
    clinicalReviewRecommended: row.clinicalReviewRecommended === true,
    repairAvailable: row.repairAvailable === true,
    sparePartsAvailable: row.sparePartsAvailable === true,
    sourceClaims: {
      intendedUse: limitedText(row.intendedUse, 400),
      accessNeed: limitedText(row.accessNeed, 400),
      tgaArtgStatus: limitedText(row.tgaArtgStatus, 160),
      ndisGuidance: limitedText(row.ndisGuidance, 600),
    },
    assurance: {
      supplierIdentity: "not-verified",
      productSafety: "not-verified",
      ndisEligibility: "not-assessed",
      provenance: "unreviewed-source",
    },
    commerce: {
      checkoutAvailable: false,
      quoteSubmissionAvailable: false,
      sellerContactAvailable: false,
    },
  };
}
