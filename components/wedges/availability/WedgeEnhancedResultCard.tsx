"use client";

import Link from "next/link";

import type { Provider } from "@/app/provider-finder/providers";
import { ProviderFinderResultCard } from "@/components/provider-finder/ProviderFinderResultCard";
import { AccessFitSummary } from "@/components/wedges/access-fit/AccessFitSummary";
import { ProviderAvailabilityCard } from "@/components/wedges/availability/ProviderAvailabilityCard";
import { ResponseTimeBadge } from "@/components/wedges/trust/ResponseTimeBadge";
import { TrustScoreBadge } from "@/components/wedges/trust/TrustBreakdown";
import { VerificationBadgeFromScore } from "@/components/wedges/trust/VerificationBadge";
import { accessFitScore } from "@/lib/access-fit/score";
import { wedgesConfig } from "@/lib/config/wedges";
import {
  DEMO_ACCESS_PROFILE,
  MOCK_RESPONSE_SLA,
  MOCK_TRUST_SCORES,
} from "@/lib/wedges/mock-providers";
import { resolveWedgeProvider } from "@/lib/wedges/provider-registry/resolve";

type WedgeEnhancedResultCardProps = {
  provider: Provider;
  isSelected?: boolean;
  isCompared?: boolean;
  onSelect?: (provider: Provider) => void;
  onToggleCompare?: (provider: Provider) => void;
};

export function WedgeEnhancedResultCard(props: WedgeEnhancedResultCardProps) {
  if (!wedgesConfig.mvpEnabled) {
    return <ProviderFinderResultCard {...props} />;
  }

  const wedge = resolveWedgeProvider(props.provider.id) ??
    resolveWedgeProvider(props.provider.slug);

  return (
    <div className="space-y-3">
      <ProviderFinderResultCard {...props} />
      {wedge ? (
        <div className="space-y-3 pl-1">
          <ProviderAvailabilityCard
            availability={wedge.availability}
            compact
          />
          <AccessFitSummary
            result={accessFitScore(DEMO_ACCESS_PROFILE, wedge.accessCapabilities)}
            showDetails={false}
          />
          {MOCK_TRUST_SCORES[wedge.id] ? (
            <div className="flex flex-wrap items-center gap-2">
              <TrustScoreBadge score={MOCK_TRUST_SCORES[wedge.id].overallScore} />
              <VerificationBadgeFromScore
                score={MOCK_TRUST_SCORES[wedge.id].overallScore}
                hasAccessVerified={
                  wedge.accessCapability.verificationSource === "mapable-assessed"
                }
              />
            </div>
          ) : null}
          {MOCK_RESPONSE_SLA[wedge.id] ? (
            <ResponseTimeBadge sla={MOCK_RESPONSE_SLA[wedge.id]} />
          ) : null}
          <Link
            href="/request-support"
            className="text-sm text-primary underline"
          >
            Request introduction
          </Link>
        </div>
      ) : null}
    </div>
  );
}
