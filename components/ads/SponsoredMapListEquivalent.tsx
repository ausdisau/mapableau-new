"use client";

import type { SponsoredAdResult } from "@/types/ads";
import { SponsoredLabel } from "@/components/ads/SponsoredLabel";
import { ReportAdButton } from "@/components/ads/ReportAdButton";
import { WhyAmISeeingThis } from "@/components/ads/WhyAmISeeingThis";

type SponsoredMapListEquivalentProps = {
  ads: SponsoredAdResult[];
  onSelect?: (ad: SponsoredAdResult) => void;
  onHidden?: (campaignId: string) => void;
};

/** Keyboard/screen-reader equivalent for map-only sponsored pins. */
export function SponsoredMapListEquivalent({
  ads,
  onSelect,
  onHidden,
}: SponsoredMapListEquivalentProps) {
  if (ads.length === 0) return null;

  return (
    <section
      aria-label="Sponsored map results"
      className="rounded-xl border border-border/60 bg-muted/20 p-4"
    >
      <h3 className="text-sm font-semibold">Sponsored on map</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        These sponsored providers also appear as pins on the map above.
      </p>
      <ul className="mt-3 space-y-3">
        {ads.map((ad) => (
          <li key={ad.campaignId}>
            <article
              className="rounded-lg border border-border/60 bg-card p-3"
              aria-label={`Sponsored: ${ad.headline}`}
            >
              <div className="flex items-center gap-2">
                <SponsoredLabel compact />
                <span className="font-medium text-sm">{ad.headline}</span>
              </div>
              {ad.description ? (
                <p className="mt-1 text-xs text-muted-foreground">{ad.description}</p>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="text-sm text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  onClick={() => onSelect?.(ad)}
                >
                  Show on map
                </button>
              </div>
              <div className="mt-2">
                <WhyAmISeeingThis reasons={ad.targetingSummary} />
                <ReportAdButton
                  campaignId={ad.campaignId}
                  onHidden={() => onHidden?.(ad.campaignId)}
                />
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
