"use client";

import React from "react";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

export function AccessIntelligenceShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white text-[#0C1833]">
      <a
        href="#access-intelligence-main"
        className={`sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-[#F8C51C] focus:px-4 focus:py-2 focus:font-bold ${mapableCareFocusRing}`}
      >
        Skip to Access Intelligence content
      </a>
      <header className="border-b border-slate-200 bg-gradient-to-br from-[#F6FBFC] via-white to-[#E8F4F8]">
        <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-[#005B7F]">
            MapAble Access Intelligence
          </p>
          <h1 className="mt-2 max-w-4xl text-4xl font-black tracking-[-0.04em] md:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-600">{description}</p>
          <p className="mt-3 max-w-3xl text-sm text-slate-500">
            Accessibility is a relationship between a person, a destination, a route,
            available evidence, and current conditions — not a universal venue rating.
            This tool provides planning support, not legal certification.
          </p>
          <nav aria-label="Access Intelligence" className="mt-6 flex flex-wrap gap-3">
            <a
              href="/access-intelligence"
              className={`inline-flex min-h-11 items-center rounded-xl bg-[#005B7F] px-4 text-sm font-black text-white ${mapableCareFocusRing}`}
            >
              Ask Access
            </a>
            <a
              href="/access-intelligence/explore"
              className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-black ${mapableCareFocusRing}`}
            >
              Explore places
            </a>
            <a
              href="/access-intelligence/passport"
              className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-black ${mapableCareFocusRing}`}
            >
              Access Passports
            </a>
            <a
              href="/access-intelligence/visit-plans"
              className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-black ${mapableCareFocusRing}`}
            >
              Visit plans
            </a>
            <a
              href="/access-intelligence/pulse"
              className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-black ${mapableCareFocusRing}`}
            >
              Access Pulse
            </a>
            <a
              href="/access-intelligence/venue-studio"
              className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-black ${mapableCareFocusRing}`}
            >
              Venue Studio
            </a>
            <a
              href="/access-intelligence/insights"
              className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-black ${mapableCareFocusRing}`}
            >
              Partner insights
            </a>
          </nav>
        </div>
      </header>
      <main id="access-intelligence-main" className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        {children}
      </main>
    </div>
  );
}
