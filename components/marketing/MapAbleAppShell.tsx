"use client";

import Link from "next/link";
import React, { type ReactNode } from "react";

import { SkipToContent } from "@/components/core/SkipToContent";
import {
  LogoMark,
  MapAbleCareMarketingHeader,
} from "@/components/marketing/mapable-care-shared";
import { MapAbleAppCompactHeader } from "@/components/marketing/MapAbleAppCompactHeader";
import {
  MapAbleCareMarketingFooter,
  MapAbleCareSlimFooter,
} from "@/components/marketing/MapAbleCareMarketingFooter";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

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
      <div className="flex min-h-screen flex-col bg-white text-[#0C1833]">
        <SkipToContent />
        <MapAbleCareMarketingHeader />
        <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        <MapAbleCareMarketingFooter />
      </div>
    );
  }

  if (variant === "minimal") {
    return (
      <div className="flex min-h-screen flex-col bg-white text-[#0C1833]">
        <SkipToContent />
        <header className="border-b border-slate-200 bg-white px-5 py-3">
          <Link
            href="/"
            aria-label="MapAble home"
            className={`inline-flex rounded-xl p-1 ${mapableCareFocusRing}`}
          >
            <LogoMark compact decorative />
          </Link>
        </header>
        <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F6FBFC] text-[#0C1833]">
      <SkipToContent />
      <MapAbleAppCompactHeader
        title={headerTitle}
        actions={headerActions}
        logoHref={logoHref ?? "/dashboard"}
      />
      {secondaryNav}
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 outline-none"
      >
        {children}
      </main>
      <MapAbleCareSlimFooter />
    </div>
  );
}
