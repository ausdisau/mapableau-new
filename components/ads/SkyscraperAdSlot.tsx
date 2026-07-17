"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { AdDisclosureLink } from "@/components/ads/AdDisclosureLink";
import { AdPlaceholder } from "@/components/ads/AdPlaceholder";
import { SponsoredLabel } from "@/components/ads/SponsoredLabel";
import { trackAdClick, trackAdHidden } from "@/lib/ads/ad-click-service";
import { trackAdImpression } from "@/lib/ads/ad-impression-service";
import { buildSafeAdContext } from "@/lib/ads/ad-slot-policy";
import type { AdSlotResponse, AdSlotStatus } from "@/lib/ads/ad-slot-content";
import { cn } from "@/app/lib/utils";

export type SkyscraperAdSlotProps = {
  slotId: string;
  side: "left" | "right";
  pageContext: string;
  userRole?: string;
  className?: string;
  serviceCategory?: string;
  region?: string;
};

export function SkyscraperAdSlot({
  slotId,
  side,
  pageContext,
  className,
  serviceCategory,
  region,
}: SkyscraperAdSlotProps) {
  const [status, setStatus] = useState<AdSlotStatus>("loading");
  const [slot, setSlot] = useState<AdSlotResponse | null>(null);
  const [hidden, setHidden] = useState(false);
  const rootRef = useRef<HTMLElement>(null);

  const safeContext = buildSafeAdContext({
    pageContext,
    serviceCategory,
    region,
  });

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    const params = new URLSearchParams({
      slotId,
      pageContext,
      ...(serviceCategory ? { serviceCategory } : {}),
      ...(region ? { region } : {}),
    });
    void fetch(`/api/ads/slots?${params}`)
      .then((res) => res.json())
      .then((data: { slot?: AdSlotResponse }) => {
        if (cancelled) return;
        const s = data.slot ?? { slotId, status: "empty" as const };
        setSlot(s);
        setStatus(s.status);
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [slotId, pageContext, serviceCategory, region]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || hidden || status !== "filled" || !slot?.creative) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          trackAdImpression({
            slotId,
            side,
            pageContext,
            context: safeContext,
            creativeId: slot.creative?.id,
          });
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hidden, status, slot, slotId, side, pageContext, safeContext]);

  const onHide = useCallback(() => {
    setHidden(true);
    trackAdHidden({ slotId, side, pageContext, context: safeContext });
  }, [slotId, side, pageContext, safeContext]);

  if (hidden) return null;

  const width = slot?.creative?.width ?? 160;

  return (
    <aside
      ref={rootRef}
      aria-label="Sponsored content"
      className={cn(
        "hidden w-full shrink-0 xl:block",
        side === "left" ? "justify-self-end" : "justify-self-start",
        className,
      )}
    >
      <div
        className={cn(
          "sticky flex flex-col gap-2 motion-reduce:transition-none",
          "top-[calc(var(--mapable-header-offset,5rem)+1rem)]",
          "max-h-[calc(100vh-var(--mapable-header-offset,5rem)-2rem)]",
        )}
      >
        <SponsoredLabel />
        {status === "loading" ? (
          <AdPlaceholder width={width} message="Loading…" />
        ) : null}
        {status === "empty" || status === "blocked" ? (
          <AdPlaceholder
            width={width}
            message={status === "blocked" ? "Unavailable" : "No ad"}
          />
        ) : null}
        {status === "error" ? (
          <AdPlaceholder width={width} message="Could not load" />
        ) : null}
        {status === "filled" && slot?.creative ? (
          <div
            className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"
            style={{ width }}
          >
            <a
              href={slot.creative.href}
              className="block p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label={`Sponsored: ${slot.creative.title}`}
              onClick={() =>
                trackAdClick({
                  slotId,
                  side,
                  pageContext,
                  context: safeContext,
                  creativeId: slot.creative?.id,
                })
              }
              rel="sponsored noopener noreferrer"
              target="_blank"
            >
              <p className="font-semibold leading-snug">{slot.creative.title}</p>
              {slot.creative.description ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  {slot.creative.description}
                </p>
              ) : null}
              <p className="mt-3 text-xs font-medium text-primary">
                Learn more
              </p>
            </a>
          </div>
        ) : null}
        <div className="flex flex-col gap-1 px-1">
          <AdDisclosureLink />
          <button
            type="button"
            className="text-left text-xs text-muted-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={onHide}
          >
            Hide this ad
          </button>
        </div>
      </div>
    </aside>
  );
}
