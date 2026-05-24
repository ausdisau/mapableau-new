"use client";

import Image from "next/image";

import { cn } from "@/app/lib/utils";
import { AdLabel } from "@/components/ads/AdLabel";
import { useAdSlot, type AdServeParams } from "@/components/ads/use-ad-slot";
import { Button } from "@/components/ui/button";

type SponsoredProviderCardProps = AdServeParams & {
  className?: string;
};

export function SponsoredProviderCard({
  className,
  ...params
}: SponsoredProviderCardProps) {
  const { ad, onClick } = useAdSlot({
    ...params,
    placement: "sponsored_provider_card",
  });

  if (!ad) return null;

  return (
    <article
      className={cn(
        "rounded-xl border-2 border-primary/25 bg-gradient-to-br from-primary/5 to-card p-5 shadow-sm",
        className
      )}
      aria-labelledby={`sponsored-ad-${ad.creativeId}`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <AdLabel variant="sponsored" />
        <span className="text-xs text-muted-foreground">{ad.advertiserName}</span>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row">
        {ad.imageUrl ? (
          <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:h-28 sm:w-36">
            <Image
              src={ad.imageUrl}
              alt={ad.altText}
              fill
              className="object-cover"
              sizes="144px"
              unoptimized
            />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <h3
            id={`sponsored-ad-${ad.creativeId}`}
            className="text-lg font-semibold text-foreground"
          >
            {ad.headline}
          </h3>
          {ad.body ? (
            <p className="mt-1 text-sm text-muted-foreground">{ad.body}</p>
          ) : null}
          <Button type="button" variant="default" size="default" className="mt-4" onClick={onClick}>
            {ad.ctaLabel}
          </Button>
        </div>
      </div>
    </article>
  );
}
