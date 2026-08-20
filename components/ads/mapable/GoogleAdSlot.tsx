"use client";

import { useGoogleAdManager } from "@/hooks/ads/useGoogleAdManager";
import { SponsoredDisclosure } from "@/components/ads/mapable/SponsoredDisclosure";

type GoogleAdSlotProps = {
  enabled: boolean;
  elementId: string;
  adUnitPath: string;
};

export function GoogleAdSlot({
  enabled,
  elementId,
  adUnitPath,
}: GoogleAdSlotProps) {
  useGoogleAdManager({ enabled, elementId, adUnitPath });

  if (!enabled || !adUnitPath) return null;

  return (
    <div data-ads-provider="google_ad_manager" className="p-3">
      <SponsoredDisclosure />
      <div id={elementId} className="min-h-[50px]" />
    </div>
  );
}
