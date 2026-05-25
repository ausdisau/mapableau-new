"use client";

import React, { type ReactNode } from "react";

import { useAdEligibility } from "@/hooks/useAdEligibility";
import { SkyscraperAdSlot } from "@/components/ads/SkyscraperAdSlot";

type AdRailLayoutProps = {
  children: ReactNode;
};

/**
 * Desktop skyscraper rails around centred main content.
 * Hidden on mobile/tablet and on sensitive routes (see ad-page-eligibility).
 */
export function AdRailLayout({ children }: AdRailLayoutProps) {
  const { eligible, pageContext } = useAdEligibility();

  if (!eligible) {
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
          "lg:grid-cols-[minmax(0,1fr)]",
          "xl:grid-cols-[minmax(0,160px)_minmax(0,1fr)_minmax(0,160px)]",
          "2xl:grid-cols-[minmax(0,300px)_minmax(0,1fr)_minmax(0,300px)]",
        ].join(" ")}
      >
        <SkyscraperAdSlot
          slotId="skyscraper-left"
          side="left"
          pageContext={pageContext}
          className="max-xl:hidden"
        />
        <div className="min-w-0 max-w-4xl justify-self-center w-full xl:max-w-none xl:justify-self-stretch">
          {children}
        </div>
        <SkyscraperAdSlot
          slotId="skyscraper-right"
          side="right"
          pageContext={pageContext}
          className="max-xl:hidden"
        />
      </div>
      <div
        className="mx-auto max-w-4xl px-4 pb-6 lg:hidden"
        aria-label="Sponsored content"
      >
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Sponsored
        </p>
        <p className="text-center text-sm text-muted-foreground">
          Side advertisements are hidden on smaller screens to keep content easy
          to read without horizontal scrolling.
        </p>
      </div>
    </div>
  );
}
