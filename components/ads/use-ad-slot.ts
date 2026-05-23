"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ServedAd } from "@/lib/ads/serve-service";

export type AdServeParams = {
  placement?: string;
  pageContext?: string;
  serviceCategory?: string;
  state?: string;
  deviceType?: string;
};

function detectDeviceType(): string {
  if (typeof window === "undefined") return "unknown";
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

export function useAdSlot(params: AdServeParams & { placement: string }) {
  const [ad, setAd] = useState<ServedAd | null>(null);
  const tracked = useRef(false);

  useEffect(() => {
    const qs = new URLSearchParams({
      placement: params.placement,
      deviceType: params.deviceType ?? detectDeviceType(),
    });
    if (params.pageContext) qs.set("pageContext", params.pageContext);
    if (params.serviceCategory) qs.set("serviceCategory", params.serviceCategory);
    if (params.state) qs.set("state", params.state);

    fetch(`/api/ads/serve?${qs.toString()}`)
      .then((r) => r.json())
      .then((data: { ads?: ServedAd[] }) => {
        setAd(data.ads?.[0] ?? null);
      })
      .catch(() => setAd(null));
  }, [
    params.placement,
    params.pageContext,
    params.serviceCategory,
    params.state,
    params.deviceType,
  ]);

  const track = useCallback(
    async (type: "impression" | "click") => {
      if (!ad) return;
      await fetch("/api/ads/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: ad.campaignId,
          placement: ad.placement,
          type,
          regionCode: params.state ?? "AU",
          deviceType: params.deviceType ?? detectDeviceType(),
        }),
      });
    },
    [ad, params.state, params.deviceType]
  );

  useEffect(() => {
    if (!ad || tracked.current) return;
    tracked.current = true;
    void track("impression");
  }, [ad, track]);

  const onClick = useCallback(() => {
    void track("click");
    if (ad?.landingUrl) {
      window.open(ad.landingUrl, "_blank", "noopener,noreferrer");
    }
  }, [ad, track]);

  return { ad, onClick };
}
