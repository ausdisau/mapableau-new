"use client";

import type { ReactNode } from "react";

import { AdSenseSkyscraperUnit } from "@/components/ads/AdSenseSkyscraperUnit";
import { useAdEligibility } from "@/hooks/useAdEligibility";
import { getAdSenseSkyscraperConfig } from "@/lib/ads/adsense-config";

type AdSenseSkyscraperLayoutProps = {
  children: ReactNode;
};

/**
 * Desktop skyscraper AdSense units on either side of the main body.
 * Hidden on viewports below xl and on sensitive routes.
 */
export function AdSenseSkyscraperLayout({ children }: AdSenseSkyscraperLayoutProps) {
  const { eligible } = useAdEligibility();
  const config = getAdSenseSkyscraperConfig();

  if (!eligible || !config) {
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
        <AdSenseSkyscraperUnit
          adClient={config.clientId}
          adSlot={config.leftSlotId}
          side="left"
          className="max-xl:hidden"
        />
        <div className="min-w-0 w-full justify-self-center xl:max-w-none xl:justify-self-stretch">
          {children}
        </div>
        <AdSenseSkyscraperUnit
          adClient={config.clientId}
          adSlot={config.rightSlotId}
          side="right"
          className="max-xl:hidden"
        />
      </div>
    </div>
  );
}
