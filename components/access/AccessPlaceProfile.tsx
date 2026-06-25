import Link from "next/link";

import { AccessConfidenceBadge } from "@/components/access/AccessConfidenceBadge";
import {
  AccessDomainScorePanel,
  type DomainScoreData,
} from "@/components/access/AccessDomainScorePanel";
import { AccessFeatureBadges } from "@/components/access/AccessFeatureBadges";
import { AccessibilityDisclaimerPanel } from "@/components/access/AccessibilityDisclaimerPanel";
import { AccreditationSummaryPanel } from "@/components/access-accreditation/AccreditationSummaryPanel";
import { CommunityReportsFeed } from "@/components/access/CommunityReportsFeed";
import { VenueClaimStatusBanner } from "@/components/access/VenueClaimStatusBanner";
import { ACCESS_LABELS } from "@/lib/access-map/copy";
import type {
  AccessAccreditationTier,
  AccessConfidenceLevel,
} from "@prisma/client";

export function AccessPlaceProfile({
  place,
  domainScores,
  reportsFeed,
  accreditation,
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
  domainScores: {
    overallScore: number | null;
    confidenceScore: number | null;
    lastUpdated: string | null;
    domains: DomainScoreData[];
  };
  reportsFeed: {
    id: string;
    displayName: string;
    reviewBody: string;
    reportType: string;
    createdAt: string;
    verifications?: Record<string, number>;
  }[];
  accreditation: {
    tier: string;
    totalScore: number;
    expired?: boolean;
  } | null;
  claimedByVenue: boolean;
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

      <VenueClaimStatusBanner
        claimedByVenue={claimedByVenue}
        placeId={place.id}
      />

      <AccessDomainScorePanel
        overallScore={domainScores.overallScore}
        confidenceScore={domainScores.confidenceScore}
        lastUpdated={domainScores.lastUpdated}
        domains={domainScores.domains}
      />

      <section aria-labelledby="access-features-heading">
        <h2 id="access-features-heading" className="text-lg font-semibold">
          Key access features
        </h2>
        <div className="mt-2">
          <AccessFeatureBadges features={place.features} />
        </div>
      </section>

      <CommunityReportsFeed placeId={place.id} reports={reportsFeed} />

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
          href={`/access/places/${place.id}/report/new`}
          className="min-h-11 inline-flex items-center rounded-lg bg-primary px-4 text-primary-foreground"
        >
          Add access report
        </Link>
        <Link
          href={`/access/alerts/new?placeId=${place.id}`}
          className="min-h-11 inline-flex items-center rounded-lg border border-border px-4"
        >
          Flag access alert
        </Link>
        <Link
          href={`/access/places/${place.id}/claim`}
          className="min-h-11 inline-flex items-center rounded-lg border border-border px-4"
        >
          Claim as venue owner
        </Link>
      </div>

      <p className="text-xs text-muted-foreground">{ACCESS_LABELS.userReported}</p>
      <AccessibilityDisclaimerPanel />
    </div>
  );
}
