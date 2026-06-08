"use client";

import Image from "next/image";

import { cn } from "@/app/lib/utils";
import { AdLabel } from "@/components/ads/AdLabel";
import { useAdSlot, type AdServeParams } from "@/components/ads/use-ad-slot";
import { Button } from "@/components/ui/button";

type AdSkyscraperSlotProps = Omit<AdServeParams, "placement"> & {
  side: "left" | "right";
  className?: string;
};

export function AdSkyscraperSlot({
  side,
  className,
  ...params
}: AdSkyscraperSlotProps) {
  const placement =
    side === "left" ? "skyscraper_left" : "skyscraper_right";
  const { ad, onClick } = useAdSlot({ ...params, placement });

  if (!ad) return null;

  return (
    <aside
      className={cn(
        "hidden 2xl:flex 2xl:w-40 2xl:shrink-0 2xl:flex-col",
        className
      )}
      aria-label={`Advertisement ${side}`}
    >
      <div className="sticky top-24 flex min-h-[320px] flex-col rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
        <AdLabel className="mb-3" />
        {ad.imageUrl ? (
          <div className="relative mb-3 aspect-[3/4] w-full overflow-hidden rounded-lg bg-muted">
            <Image
              src={ad.imageUrl}
              alt={ad.altText}
              fill
              className="object-cover"
              sizes="160px"
              unoptimized
            />
          </div>
        ) : null}
        <p className="text-sm font-semibold leading-snug text-foreground">
          {ad.headline}
        </p>
        {ad.body ? (
          <p className="mt-2 text-xs text-muted-foreground line-clamp-4">
            {ad.body}
          </p>
        ) : null}
        <Button
          type="button"
          variant="default"
          size="sm"
          className="mt-4 w-full"
          onClick={onClick}
          aria-label={`${ad.ctaLabel} — ${ad.headline}`}
        >
          {ad.ctaLabel}
        </Button>
        <p className="mt-2 text-[10px] text-muted-foreground">
          {ad.advertiserName}
        </p>
      </div>
    </aside>
  );
}
