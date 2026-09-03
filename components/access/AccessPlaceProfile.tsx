import type {
  AccessAccreditationTier,
  AccessConfidenceLevel,
} from "@prisma/client";
import Link from "next/link";

import { AccessConfidenceBadge } from "@/components/access/AccessConfidenceBadge";
import { AccessFeatureBadges } from "@/components/access/AccessFeatureBadges";
import { AccessibilityDisclaimerPanel } from "@/components/access/AccessibilityDisclaimerPanel";
import { AccessPlaceExperienceV2Panel } from "@/components/access/AccessPlaceExperienceV2Panel";
import { AccreditationSummaryPanel } from "@/components/access-accreditation/AccreditationSummaryPanel";
import { CommunityReviewPreview } from "@/components/access-reviews/CommunityReviewPreview";
import type { AccessExplorationPlace } from "@/lib/access/experience/access-exploration-dto";
import { ACCESS_LABELS } from "@/lib/access/map/copy";

export function AccessPlaceProfile({
  place,
  reviews,
  accreditation,
  experienceV2 = false,
  explorationPlace,
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
    updatedAt?: string | null;
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
  experienceV2?: boolean;
  explorationPlace?: AccessExplorationPlace;
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
        <div className="mt-3">
          <AccessConfidenceBadge
            level={place.confidence}
            accreditationTier={
              place.confidence === "mapable_accredited" && accreditation
                ? (accreditation.tier as AccessAccreditationTier)
                : null
            }
          />
        </div>
      </header>

      {experienceV2 ? (
        <AccessPlaceExperienceV2Panel
          explorationPlace={explorationPlace}
          place={{
            id: place.id,
            name: place.name,
            category: place.category,
            description: place.description,
            addressText: place.addressText,
            suburb: place.suburb,
            stateOrRegion: place.stateOrRegion,
            confidence: place.confidence,
            sourceType: place.sourceType,
            updatedAt: place.updatedAt,
            features: place.features,
          }}
        />
      ) : null}

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
          Community rating summary is user-reported, not legal certification.
        </p>
        <CommunityReviewPreview reviews={reviews} placeId={place.id} />
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
          href={`/access/review/${place.id}`}
          className="min-h-11 inline-flex items-center rounded-lg bg-primary px-4 text-primary-foreground"
        >
          Add community review
        </Link>
        <Link
          href={`/access/places/${place.id}/claim`}
          className="min-h-11 inline-flex items-center rounded-lg border border-border px-4"
        >
          Claim as venue owner
        </Link>
        {!experienceV2 ? (
          <Link
            href="/journey-planner"
            className="min-h-11 inline-flex items-center rounded-lg border border-border px-4"
          >
            Plan accessible trip
          </Link>
        ) : null}
        <Link
          href="/transport"
          className="min-h-11 inline-flex items-center rounded-lg border border-border px-4"
        >
          Book transport
        </Link>
        <Link
          href="/care/request"
          className="min-h-11 inline-flex items-center rounded-lg border border-border px-4"
        >
          Request support worker
        </Link>
        {!experienceV2 ? (
          <Link
            href="/add-access-info"
            className="min-h-11 inline-flex items-center rounded-lg border border-border px-4"
          >
            Report outdated info
          </Link>
        ) : null}
      </div>

      <p className="text-sm text-muted-foreground" role="note">
        MapAble verification provides access information, not legal certification.
      </p>

      <AccessibilityDisclaimerPanel />
    </div>
  );
}
