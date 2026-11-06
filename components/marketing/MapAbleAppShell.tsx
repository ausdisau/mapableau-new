"use client";

import React, { type ReactNode } from "react";

import { MapAbleBrandLockup } from "@/components/brand/MapAbleBrandLockup";
import { SkipToContent } from "@/components/core/SkipToContent";
import { MapAbleCareMarketingHeader } from "@/components/marketing/mapable-care-shared";
import { MapAbleAppCompactHeader } from "@/components/marketing/MapAbleAppCompactHeader";
import {
  MapAbleCareMarketingFooter,
  MapAbleCareSlimFooter,
} from "@/components/marketing/MapAbleCareMarketingFooter";

export type MapAbleAppShellVariant = "marketing" | "app" | "minimal";

export function MapAbleAppShell({
  variant = "marketing",
  children,
  secondaryNav,
  headerTitle,
  headerActions,
  logoHref,
}: {
  variant?: MapAbleAppShellVariant;
  children: ReactNode;
  secondaryNav?: ReactNode;
  headerTitle?: string;
  headerActions?: ReactNode;
  logoHref?: string;
}) {
  if (variant === "marketing") {
    return (
      <div className="mapable-soft flex min-h-screen flex-col bg-white text-[#0C1833]">
        <SkipToContent />
        <MapAbleCareMarketingHeader />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <MapAbleCareMarketingFooter />
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <div className="mapable-soft flex min-h-screen flex-col bg-white text-[#0C1833]">
        <SkipToContent />
        <header className="border-b border-slate-200 bg-white px-5 py-3">
          <MapAbleBrandLockup
            href="/"
            size="header"
            className="hover:opacity-100"
          />
        </header>
        <main id="main-content" className="flex-1">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="mapable-soft flex min-h-screen flex-col bg-[#F6FBFC] text-[#0C1833]">
      <SkipToContent />
      <MapAbleAppCompactHeader
        title={headerTitle}
        actions={headerActions}
        logoHref={logoHref ?? "/dashboard"}
      />
      {secondaryNav}
      <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
      <MapAbleCareSlimFooter />
    </div>
  );
}
