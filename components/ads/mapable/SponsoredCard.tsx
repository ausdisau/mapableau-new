"use client";

import { SponsoredDisclosure } from "@/components/ads/mapable/SponsoredDisclosure";
import type { AdCreativePayload } from "@/lib/ads/types";

type SponsoredCardProps = {
  creative: AdCreativePayload;
  clickHref: string;
  onDismiss?: () => void;
  className?: string;
};

export function SponsoredCard({
  creative,
  clickHref,
  onDismiss,
  className,
}: SponsoredCardProps) {
  const name = creative.businessName ?? creative.headline;

  return (
    <aside
      className={
        className ??
        "border-t border-border bg-muted/30 p-3 motion-safe:transition-opacity"
      }
      aria-label={`Sponsored listing: ${name}`}
      data-ads-kind="sponsored-card"
    >
      <div className="flex items-start justify-between gap-2">
        <SponsoredDisclosure businessName={name} />
        {onDismiss ? (
          <button
            type="button"
            className="min-h-11 min-w-11 rounded px-2 text-sm text-muted-foreground hover:text-foreground"
            onClick={onDismiss}
            aria-label="Dismiss sponsored listing"
          >
            Close
          </button>
        ) : null}
      </div>
      <p className="mt-1 text-sm font-medium text-foreground">{name}</p>
      <p className="mt-1 text-sm text-muted-foreground">{creative.body}</p>
      <a
        href={clickHref}
        className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-primary underline-offset-2 hover:underline"
        rel="noopener noreferrer"
        target="_blank"
      >
        View details
      </a>
    </aside>
  );
}
