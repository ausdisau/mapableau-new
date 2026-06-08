"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AdLabel } from "@/components/ads/AdLabel";
import {
  getSponsoredPlacement,
  sponsoredPlacements,
  type SponsoredPlacement,
} from "@/lib/marketing/mapable-care-combined-data";

type ServedCard = {
  headline: string;
  body: string | null;
  ctaLabel: string;
  landingUrl: string;
  advertiserName: string;
};

function staticToServed(placement: SponsoredPlacement): ServedCard {
  return {
    headline: placement.title,
    body: placement.description,
    ctaLabel: placement.cta,
    landingUrl: placement.href,
    advertiserName: placement.category,
  };
}

export function DynamicSponsoredCard({
  area,
  placement,
}: {
  area: string;
  placement: SponsoredPlacement["placement"];
}) {
  const fallback = getSponsoredPlacement(area, placement);
  const [card, setCard] = useState<ServedCard | null>(
    fallback ? staticToServed(fallback) : null,
  );

  useEffect(() => {
    const qs = new URLSearchParams({
      placement: "sponsored_provider_card",
      pageContext: area.toLowerCase().replace(/\s+/g, "_"),
    });
    fetch(`/api/ads/serve?${qs.toString()}`)
      .then((r) => r.json())
      .then((data: { ads?: Array<{ headline: string; body: string | null; ctaLabel: string; landingUrl: string; advertiserName: string }> }) => {
        const ad = data.ads?.[0];
        if (ad) setCard(ad);
      })
      .catch(() => {
        /* keep static fallback */
      });
  }, [area]);

  if (!card) return null;

  return (
    <article className="rounded-2xl border border-secondary/30 bg-gradient-to-br from-secondary/10 to-card p-5 shadow-sm">
      <AdLabel className="mb-2" />
      <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
        {card.advertiserName}
      </p>
      <h3 className="mt-2 font-heading text-lg font-bold">{card.headline}</h3>
      {card.body ? (
        <p className="mt-2 text-sm text-muted-foreground">{card.body}</p>
      ) : null}
      <Link
        href={card.landingUrl}
        className="mt-4 inline-flex text-sm font-semibold text-primary underline-offset-4 hover:underline"
      >
        {card.ctaLabel}
      </Link>
    </article>
  );
}

export function hasStaticSponsoredFallback() {
  return sponsoredPlacements.length > 0;
}
