import Link from "next/link";

import { AccessAlertsPanel } from "@/components/access/AccessAlertsPanel";
import { AccessConfidenceBadge } from "@/components/access/AccessConfidenceBadge";
import { AccessDomainScorePanel } from "@/components/access/AccessDomainScorePanel";
import { AccessFeatureBadges } from "@/components/access/AccessFeatureBadges";
import { AccessVerificationActions } from "@/components/access/AccessVerificationActions";
import { AccessibilityDisclaimerPanel } from "@/components/access/AccessibilityDisclaimerPanel";
import { PlanAccessibleTransportButton } from "@/components/access/PlanAccessibleTransportButton";
import { AccreditationSummaryPanel } from "@/components/access-accreditation/AccreditationSummaryPanel";
import { CommunityReviewPreview } from "@/components/access-reviews/CommunityReviewPreview";
import { ACCESS_LABELS } from "@/lib/access-map/copy";
import type {
  AccessAccreditationTier,
  AccessConfidenceLevel,
} from "@prisma/client";

export function AccessPlaceProfile({
  place,
  reviews,
  accreditation,
  accessSummary,
  domains,
  alerts,
  claimedByVenue,
}: {
  place: {
    id: string;
    name: string;
    category: string;
    description?: string | null;
    addressText?: string | null;
    suburb?: string | null;
    stateOrRegion?: string | null;
    confidence: AccessConfidenceLevel;
    features: string[];
    sourceType: string;
  };
  reviews: {
    id: string;
    displayName: string;
    reviewBody: string;
    label: string;
    createdAt: string;
  }[];
  accreditation: {
    tier: string;
    totalScore: number;
    expired?: boolean;
  } | null;
  accessSummary?: {
    overallScore: number | null;
    confidenceScore: number | null;
    lastUpdated: string | null;
  };
  domains?: {
    domain: string;
    score: number | null;
    sampleCount: number;
  }[];
  alerts?: {
    id: string;
    alertType: string;
    title: string;
    description?: string | null;
    status: string;
    expiresAt?: string | null;
  }[];
  claimedByVenue?: boolean;
}) {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">{place.name}</h1>
        <p className="mt-1 capitalize text-muted-foreground">
          {place.category.replace(/_/g, " ")}
        </p>
        <p className="mt-2 text-sm">
          {[place.addressText, place.suburb, place.stateOrRegion]
            .filter(Boolean)
            .join(", ")}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <AccessConfidenceBadge
            level={place.confidence}
            accreditationTier={
              place.confidence === "mapable_accredited" && accreditation
                ? (accreditation.tier as AccessAccreditationTier)
                : null
            }
          />
          {claimedByVenue ? (
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
              Venue claimed
            </span>
          ) : null}
        </div>
      </header>

      {accessSummary && domains ? (
        <AccessDomainScorePanel summary={accessSummary} domains={domains} />
      ) : null}

      {alerts ? <AccessAlertsPanel alerts={alerts} /> : null}

      <PlanAccessibleTransportButton placeId={place.id} placeName={place.name} />

      <section aria-labelledby="access-features-heading">
        <h2 id="access-features-heading" className="text-lg font-semibold">
          Key access features
        </h2>
        <div className="mt-2">
          <AccessFeatureBadges features={place.features} />
        </div>
      </section>

      <section aria-labelledby="community-reviews-heading">
        <h2 id="community-reviews-heading" className="text-lg font-semibold">
          {ACCESS_LABELS.communityReviewed} ({ACCESS_LABELS.userReported})
        </h2>
        <p className="text-sm text-muted-foreground">
          Community reports describe observed conditions, not legal certification.
        </p>
        <CommunityReviewPreview reviews={reviews} placeId={place.id} />
        {reviews[0] ? (
          <div className="mt-4">
            <AccessVerificationActions
              targetType="review"
              targetId={reviews[0].id}
            />
          </div>
        ) : null}
      </section>

      {accreditation ? (
        <AccreditationSummaryPanel
          tier={accreditation.tier}
          totalScore={accreditation.totalScore}
          expired={accreditation.expired}
          placeId={place.id}
        />
      ) : null}

      {place.description ? (
        <section>
          <h2 className="text-lg font-semibold">About</h2>
          <p className="mt-2 whitespace-pre-wrap">{place.description}</p>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/access/places/${place.id}/report`}
          className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-primary-foreground"
        >
          Add access report
        </Link>
        <Link
          href={`/access/places/${place.id}/alerts/new`}
          className="inline-flex min-h-11 items-center rounded-lg border border-border px-4"
        >
          Flag access alert
        </Link>
        <Link
          href={`/access/places/${place.id}/claim`}
          className="inline-flex min-h-11 items-center rounded-lg border border-border px-4"
        >
          Claim as venue owner
        </Link>
      </div>

      <AccessibilityDisclaimerPanel />
    </div>
  );
}
