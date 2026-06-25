import type {
  AccessDisplayNameMode,
  AccessRatingValue,
  AccessReportType,
  AccessReviewStatus,
} from "@prisma/client";

export type AccessMeasurement = {
  label: string;
  value: number;
  unit: string;
};

export type AccessReport = {
  id: string;
  placeId: string;
  submittedBy: string;
  submittedAt: string;
  reportType: AccessReportType;
  accessDomains: Record<
    string,
    { score?: number; notes?: string; value?: AccessRatingValue }
  >;
  evidence: {
    photos?: string[];
    measurements?: AccessMeasurement[];
    notes?: string;
    visitedInPerson: boolean;
  };
  confidence: {
    score: number;
    verifiedByCommunity: boolean;
    verifiedByVenue: boolean;
    verifiedByMapAble: boolean;
    lastConfirmedAt?: string;
  };
  status: AccessReviewStatus;
  displayNameMode: AccessDisplayNameMode;
  reviewBody: string;
  visitDate?: string;
};

export function reviewToAccessReport(review: {
  id: string;
  placeId: string;
  reviewerProfileId: string;
  createdAt: Date;
  updatedAt: Date;
  reportType: AccessReportType;
  visitedInPerson: boolean;
  measurements: unknown;
  evidenceNotes: string | null;
  reviewBody: string;
  visitDate: Date | null;
  status: AccessReviewStatus;
  displayNameMode: AccessDisplayNameMode;
  photos?: { storagePath: string; altText: string | null }[];
  ratings?: { category: string; value: AccessRatingValue }[];
}): AccessReport {
  const measurements = Array.isArray(review.measurements)
    ? (review.measurements as AccessMeasurement[])
    : undefined;

  return {
    id: review.id,
    placeId: review.placeId,
    submittedBy: review.reviewerProfileId,
    submittedAt: review.createdAt.toISOString(),
    reportType: review.reportType,
    accessDomains: Object.fromEntries(
      (review.ratings ?? []).map((r) => [r.category, { value: r.value }])
    ),
    evidence: {
      photos: review.photos?.map((p) => p.storagePath),
      measurements,
      notes: review.evidenceNotes ?? undefined,
      visitedInPerson: review.visitedInPerson,
    },
    confidence: {
      score: 0,
      verifiedByCommunity: false,
      verifiedByVenue: false,
      verifiedByMapAble: false,
    },
    status: review.status,
    displayNameMode: review.displayNameMode,
    reviewBody: review.reviewBody,
    visitDate: review.visitDate?.toISOString(),
  };
}
