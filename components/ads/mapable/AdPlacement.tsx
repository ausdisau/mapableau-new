"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ExternalAdSlot } from "@/components/ads/mapable/ExternalAdSlot";
import { SponsoredCard } from "@/components/ads/mapable/SponsoredCard";
import type { AdPlacementFill, PlacementCode } from "@/lib/ads/types";

type AdPlacementProps = {
  placement: PlacementCode;
  surface: "access" | "provider_finder";
  bbox?: [number, number, number, number];
  zoom?: number;
  category?: string;
  regionCode?: string;
  consentForPersonalisedAds?: boolean;
  /** When false, component renders nothing (feature flag gate from parent). */
  enabled?: boolean;
  className?: string;
  onFill?: (fill: AdPlacementFill) => void;
};

/**
 * Canonical placement entry. Does not know which provider filled.
 * No-fill and failures render nothing — MapAble continues normally.
 */
export function AdPlacement({
  placement,
  surface,
  bbox,
  zoom,
  category,
  regionCode,
  consentForPersonalisedAds = false,
  enabled = false,
  className,
  onFill,
}: AdPlacementProps) {
  const [fill, setFill] = useState<AdPlacementFill | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const impressionSent = useRef(false);

  useEffect(() => {
    if (!enabled) {
      setFill(null);
      return;
    }

    let cancelled = false;
    const params = new URLSearchParams({
      surface,
      placement,
    });
    if (bbox) params.set("bbox", bbox.join(","));
    if (zoom != null) params.set("zoom", String(zoom));
    if (category) params.set("category", category);
    if (regionCode) params.set("region", regionCode);
    if (consentForPersonalisedAds) params.set("consent", "true");

    fetch(`/api/ads/placements?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) return { fill: { kind: "no_fill" as const, reasonCode: "NO_FILL" as const } };
        return (await res.json()) as { fill: AdPlacementFill };
      })
      .then((data) => {
        if (cancelled) return;
        setFill(data.fill);
        onFill?.(data.fill);
      })
      .catch(() => {
        if (cancelled) return;
        const noFill: AdPlacementFill = { kind: "no_fill", reasonCode: "PROVIDER_ERROR" };
        setFill(noFill);
        onFill?.(noFill);
      });

    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    placement,
    surface,
    bbox,
    zoom,
    category,
    regionCode,
    consentForPersonalisedAds,
    onFill,
  ]);

  useEffect(() => {
    if (!fill || fill.kind === "no_fill" || impressionSent.current) return;
    if (fill.kind !== "internal") return;

    impressionSent.current = true;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || entry.intersectionRatio < 0.5) return;
        void fetch("/api/ads/impressions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            decisionId: fill.decisionId,
            placementCode: placement,
            provider: fill.provider,
            campaignId: fill.campaignId,
          }),
        });
        observer.disconnect();
      },
      { threshold: 0.5 },
    );

    const node = document.querySelector(
      `[data-ads-decision="${fill.decisionId}"]`,
    );
    if (node) observer.observe(node);
    return () => observer.disconnect();
  }, [fill, placement]);

  const handleNoFill = useCallback(() => {
    setFill({ kind: "no_fill", reasonCode: "NO_FILL" });
  }, []);

  if (!enabled || dismissed || !fill || fill.kind === "no_fill") {
    return null;
  }

  if (fill.kind === "internal") {
    return (
      <div
        className={className}
        data-ads-decision={fill.decisionId}
        data-ads-placement={placement}
      >
        <SponsoredCard
          creative={fill.creative}
          clickHref={fill.clickPath}
          onDismiss={() => setDismissed(true)}
        />
      </div>
    );
  }

  return (
    <div className={className} data-ads-decision={fill.decisionId}>
      <ExternalAdSlot
        provider={fill.provider}
        slotKey={fill.slotKey}
        externalContext={fill.externalContext}
        onNoFill={handleNoFill}
      />
    </div>
  );
}
