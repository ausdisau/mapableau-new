"use client";

import { useEffect } from "react";
import Link from "next/link";

import type { Provider } from "@/app/provider-finder/providers";
import { SponsoredLabel } from "@/components/ads/SponsoredLabel";
import { WhyAmISeeingThis } from "@/components/ads/WhyAmISeeingThis";
import { ReportAdButton } from "@/components/ads/ReportAdButton";
import { Button } from "@/components/ui/button";
import type { SponsoredAdResult } from "@/types/ads";

type SponsoredResultCardProps = {
  ad: SponsoredAdResult;
  provider?: Provider | null;
  onSelect?: (provider: Provider) => void;
  onHidden?: () => void;
};

function profileHref(ad: SponsoredAdResult, provider?: Provider | null) {
  if (provider?.slug) return `/jonathan/profile/${encodeURIComponent(provider.slug)}`;
  if (ad.providerOutletKey) {
    return `/jonathan/profile/${encodeURIComponent(ad.providerOutletKey)}`;
  }
  return ad.ctaUrl ?? "#";
}

export function SponsoredResultCard({
  ad,
  provider,
  onSelect,
  onHidden,
}: SponsoredResultCardProps) {
  const href = profileHref(ad, provider);

  useEffect(() => {
    void fetch("/api/ads/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaignId: ad.campaignId,
        creativeId: ad.creativeId,
        eventType: "impression",
        placementSurface: "provider_finder",
      }),
    });
  }, [ad.campaignId, ad.creativeId]);

  const trackClick = async () => {
    await fetch("/api/ads/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaignId: ad.campaignId,
        creativeId: ad.creativeId,
        eventType: "click",
        placementSurface: "provider_finder",
      }),
    });
  };

  return (
    <article
      className="rounded-xl border border-amber-500/30 bg-card p-5 shadow-sm motion-reduce:transition-none"
      aria-label={`Sponsored: ${ad.headline}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <SponsoredLabel />
        {!ad.verificationPassed ? (
          <span className="text-xs text-destructive">Verification pending</span>
        ) : null}
      </div>

      {provider ? (
        <button
          type="button"
          className="mt-3 w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
          onClick={() => onSelect?.(provider)}
        >
          <h3 className="font-heading text-lg font-semibold">{provider.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {provider.categories[0] ?? ad.headline}
          </p>
        </button>
      ) : (
        <h3 className="mt-3 font-heading text-lg font-semibold">{ad.headline}</h3>
      )}

      {ad.description ? (
        <p className="mt-2 text-sm text-muted-foreground">{ad.description}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="default" size="default" asChild onClick={trackClick}>
          <Link href={href}>
            {ad.ctaLabel ?? "View profile"}
          </Link>
        </Button>
      </div>

      <div className="mt-4 space-y-3 border-t border-border/60 pt-4">
        <WhyAmISeeingThis reasons={ad.targetingSummary} />
        <ReportAdButton campaignId={ad.campaignId} onHidden={onHidden} />
      </div>
    </article>
  );
}
