"use client";

import Link from "next/link";
import React, { type ReactNode } from "react";

import { ArrowIcon, SearchIcon } from "@/components/marketing/mapable-care-icons";
import { MapAbleCareMarketingFooter } from "@/components/marketing/MapAbleCareMarketingFooter";
import { WavyText } from "@/components/marketing/MapAbleCareTypography";
import { GuidedSearchPanel } from "@/components/marketing/home/GuidedSearchPanel";
import { HeroSection } from "@/components/marketing/home/HeroSection";
import { PersonaEntrySection } from "@/components/marketing/home/PersonaEntrySection";
import {
  MapAbleCareMarketingHeader,
  SponsoredBadge,
  SponsoredCard,
} from "@/components/marketing/mapable-care-shared";
import {
  differenceCards,
  getSponsoredPlacement,
  marketplaceCards,
} from "@/lib/marketing/mapable-care-combined-data";

export { mapAbleCareCombinedDesignTests } from "@/lib/marketing/mapable-care-combined-data";
export { MapAbleCareMarketingTypography } from "@/components/marketing/MapAbleCareTypography";
export { MapAbleCareMarketingHeader } from "@/components/marketing/mapable-care-shared";
export { MapAbleCareMarketingFooter } from "@/components/marketing/MapAbleCareMarketingFooter";

function SparkIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M12 2.8 13.9 8l5.3 1.9-5.3 1.9L12 17l-1.9-5.2-5.3-1.9L10.1 8 12 2.8ZM18.5 15l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9.9-2.4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M12 3.2 19 6v5.3c0 4.4-2.8 7.8-7 9.5-4.2-1.7-7-5.1-7-9.5V6l7-2.8Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path
        d="m8.7 12 2.1 2.1 4.7-5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MarketplaceGrid() {
  return (
    <section id="explore" className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
      <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#005B7F]">
            Combined marketplace
          </p>
          <h2 className="mt-3 text-3xl font-black leading-[1.08] tracking-[-0.04em] text-[#0C1833] md:text-5xl">
            <WavyText text="More than a care marketplace." />
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-600">
            MapAble keeps the familiar marketplace benefits users expect, then adds a distinctive
            access-aware layer across care, transport, jobs, places and support.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {marketplaceCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/80 motion-reduce:transform-none focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F8C51C]/25 text-xl">
                  {card.icon}
                </div>
                <span className="rounded-full bg-[#F6FBFC] px-3 py-1 text-xs font-black text-[#005B7F]">
                  {card.eyebrow}
                </span>
              </div>
              <h3 className="mapable-display mt-5 text-2xl font-black tracking-[-0.045em] text-[#0C1833]">
                {card.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{card.body}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-[#005B7F]">
                Explore {card.title.toLowerCase()} <ArrowIcon />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function MapAbleDifference() {
  return (
    <section id="difference" className="border-y border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#005B7F]">
              The MapAble difference
            </p>
            <h2 className="mapable-display mt-3 text-4xl font-black leading-[1.02] tracking-[-0.055em] text-[#0C1833] md:text-5xl">
              Choice, safety and access should travel together.
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Hireup and Mable made support matching feel more modern. MapAble&apos;s edge is
              combining that familiarity with accessibility-aware coordination.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {differenceCards.map((card) => (
              <article
                key={card.title}
                className="rounded-[1.5rem] border border-slate-200 bg-[#F6FBFC] p-5"
              >
                <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-[#005B7F]">
                  {card.badge}
                </span>
                <h3 className="mt-4 text-lg font-black text-[#0C1833]">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{card.body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustAndSafetyBand() {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-12 lg:px-8 lg:pb-16">
      <div className="grid gap-4 rounded-[2rem] border border-slate-200 bg-[#F8C51C]/18 p-5 md:grid-cols-3 lg:p-7">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[#005B7F]">
            <ShieldIcon />
          </span>
          <div>
            <h3 className="font-black text-[#0C1833]">Verified pathways</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Designed for provider checks, clear profiles and safer hand-offs.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[#005B7F]">
            <SearchIcon />
          </span>
          <div>
            <h3 className="font-black text-[#0C1833]">Access-aware search</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Search by service, travel need, access details and practical context.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[#005B7F]">
            <SparkIcon />
          </span>
          <div>
            <h3 className="font-black text-[#0C1833]">Human support nearby</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Escalate to support when a guided search is not enough.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function PartnerStrip() {
  const placement = getSponsoredPlacement("All", "primary");
  if (!placement) return null;
  return (
    <section aria-label="Sponsored partner" className="border-y border-slate-200 bg-[#F6FBFC]">
      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div>
          <SponsoredBadge />
          <h2 className="mapable-display mt-3 text-2xl font-black tracking-[-0.045em] text-[#0C1833]">
            Helpful partners, clearly labelled.
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Sponsor placements stay separated from support guidance, safety pathways and organic
            search results.
          </p>
        </div>
        <SponsoredCard placement={placement} />
      </div>
    </section>
  );
}

export function MapAbleCareCombinedHomepageSections() {
  return (
    <>
      <HeroSection />
      <GuidedSearchPanel />
      <PersonaEntrySection />
      <MarketplaceGrid />
      <MapAbleDifference />
      <TrustAndSafetyBand />
      <PartnerStrip />
    </>
  );
}

export default function MapAbleCareCombinedHomepage() {
  return (
    <main id="main-content" className="mapable-soft flex min-h-screen flex-col bg-white text-[#0C1833]">
      <MapAbleCareMarketingHeader />
      <MapAbleCareCombinedHomepageSections />
      <MapAbleCareMarketingFooter />
    </main>
  );
}
