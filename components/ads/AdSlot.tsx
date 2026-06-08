"use client";

import type { ReactNode } from "react";

import { AdSenseSkyscraperUnit } from "@/components/ads/AdSenseSkyscraperUnit";
import { AdSkyscraperSlot } from "@/components/ads/AdSkyscraperSlot";
import { useAdSlot, type AdServeParams } from "@/components/ads/use-ad-slot";
import { useAdEligibility } from "@/hooks/useAdEligibility";
import { getAdSenseSkyscraperConfig } from "@/lib/ads/adsense-config";

type AdSlotProps = AdServeParams & {
  side: "left" | "right";
  className?: string;
  adsenseClassName?: string;
};

function AdSlotUnit({
  side,
  className,
  adsenseClassName,
  ...serveParams
}: AdSlotProps) {
  const { eligible, pageContext } = useAdEligibility();
  const config = getAdSenseSkyscraperConfig();
  const placement = side === "left" ? "skyscraper_left" : "skyscraper_right";
  const { ad } = useAdSlot({
    ...serveParams,
    placement,
    pageContext: serveParams.pageContext ?? pageContext,
  });

  if (!eligible) return null;

  if (ad) {
    return (
      <AdSkyscraperSlot
        side={side}
        className={className}
        pageContext={serveParams.pageContext ?? pageContext}
        {...serveParams}
      />
    );
  }

  if (!config) return null;

  return (
    <AdSenseSkyscraperUnit
      adClient={config.clientId}
      adSlot={side === "left" ? config.leftSlotId : config.rightSlotId}
      side={side}
      className={adsenseClassName ?? "max-xl:hidden"}
    />
  );
}

type AdSlotLayoutProps = {
  children: ReactNode;
  serveParams?: Omit<AdServeParams, "placement">;
};

export function AdSlotSkyscraperLayout({
  children,
  serveParams,
}: AdSlotLayoutProps) {
  const { eligible } = useAdEligibility();
  const config = getAdSenseSkyscraperConfig();

  if (!eligible && !config) {
    return <>{children}</>;
  }

  return (
    <div
      className="w-full overflow-x-hidden [--mapable-header-offset:5rem]"
      style={{ overflowX: "hidden" }}
    >
      <div
        className={[
          "mx-auto grid w-full max-w-[100rem] gap-4 px-4 py-4",
          "grid-cols-1",
          "xl:grid-cols-[minmax(0,160px)_minmax(0,1fr)_minmax(0,160px)]",
        ].join(" ")}
      >
        <AdSlotUnit side="left" {...serveParams} />
        <div className="min-w-0 w-full justify-self-center xl:max-w-none xl:justify-self-stretch">
          {children}
        </div>
        <AdSlotUnit side="right" {...serveParams} />
      </div>
    </div>
  );
}

/** Web ad waterfall: first-party Ads Manager → Google AdSense → PurpleAds (layout meta). */
export function AdSlot(props: AdSlotProps) {
  return <AdSlotUnit {...props} />;
}
