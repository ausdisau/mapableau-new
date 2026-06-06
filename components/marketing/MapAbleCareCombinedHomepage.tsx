"use client";

import Link from "next/link";
import React, { type ReactNode } from "react";

import { ArrowIcon, SearchIcon } from "@/components/marketing/mapable-care-icons";
import { MapAbleCareMarketingFooter } from "@/components/marketing/MapAbleCareMarketingFooter";
import { WavyText } from "@/components/marketing/MapAbleCareTypography";
import {
  GuidedSearch,
  MapAbleCareMarketingHeader,
  ResultRow,
  SponsoredBadge,
  SponsoredCard,
} from "@/components/marketing/mapable-care-shared";
import {
  differenceCards,
  getSponsoredPlacement,
  journeySteps,
  marketplaceCards,
  sampleResults,
  trustMetrics,
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

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-white/80 px-4 py-2 text-sm font-black text-[#005B7F] shadow-sm ring-1 ring-slate-200">
      {children}
    </span>
  );
}

function TrustMetrics() {
  return (
    <section aria-label="MapAble proof points" className="border-y border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-4 px-5 py-5 md:grid-cols-3 lg:px-8">
        {trustMetrics.map((metric) => (
          <div key={metric.label} className="rounded-2xl bg-[#F6FBFC] p-5">
            <p className="mapable-display text-4xl font-black tracking-[-0.06em] text-[#005B7F]">
              {metric.value}
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-600">{metric.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProfilePreviewCard() {
  return (
    <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-200/80">
      <div className="rounded-[1.5rem] bg-[#005B7F] p-5 text-white">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">Guided care search</p>
        <h2 className="mt-2 text-2xl font-black leading-[1.08] tracking-[-0.025em]">
          <WavyText text="Tell us what you need." />
        </h2>
        <p className="mt-2 text-sm leading-6 text-white/80">
          We&apos;ll help turn it into a practical next step.
        </p>
      </div>
      <div className="mt-4 grid gap-3">
        <div className="rounded-2xl border border-slate-200 bg-[#F8C51C]/15 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#005B7F]">
                Matched pathway
              </p>
              <h3 className="mt-1 text-lg font-black text-[#0C1833]">Care visit + accessible ride</h3>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#005B7F]">
              Plan
            </span>
          </div>
          <div className="mt-4 grid gap-2 text-sm text-slate-700">
            <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
              <span>Support worker</span>
              <strong>shortlist</strong>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
              <span>Transport buffer</span>
              <strong>30 min</strong>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
              <span>NDIS note</span>
              <strong>ready</strong>
            </div>
          </div>
        </div>
        {sampleResults.slice(1, 3).map((result) => (
          <ResultRow key={result.title} result={result} />
        ))}
      </div>
    </article>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#F6FBFC]">
      <div className="absolute right-[-8rem] top-[-8rem] h-80 w-80 rounded-full bg-[#F8C51C]/30 blur-3xl" />
      <div className="absolute bottom-[-10rem] left-[-8rem] h-96 w-96 rounded-full bg-[#00A979]/15 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-14 lg:grid-cols-[1fr_0.92fr] lg:px-8 lg:py-20">
        <div>
          <div className="mb-6 flex flex-wrap gap-2">
            <Pill>Care</Pill>
            <Pill>Transport</Pill>
            <Pill>NDIS Help</Pill>
            <Pill>Jobs</Pill>
            <Pill>Access</Pill>
          </div>
          <h1 className="max-w-4xl text-5xl font-black leading-[0.96] tracking-[-0.045em] text-[#0C1833] md:text-7xl">
            <WavyText text="Care and support, connected." />
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            MapAble helps people with disability find, compare and connect with care, accessible
            transport, inclusive opportunities and practical support in one friendly place.
          </p>
          <div className="mt-7 rounded-[1.7rem] border border-slate-200 bg-white p-3 shadow-xl shadow-slate-200/70 lg:max-w-2xl">
            <GuidedSearch />
          </div>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/provider-finder"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#005B7F] px-6 py-4 text-base font-black text-white shadow-sm transition hover:bg-[#004766] focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
            >
              Find support <ArrowIcon />
            </Link>
            <a
              href="#difference"
              className="inline-flex items-center justify-center rounded-2xl border-2 border-[#0C1833] px-6 py-4 text-base font-black text-[#0C1833] transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
            >
              Why MapAble is different
            </a>
          </div>
          <p className="mt-5 text-sm font-semibold text-slate-500">
            Compare options. Understand next steps. Connect with support that fits your life.
          </p>
        </div>
        <ProfilePreviewCard />
      </div>
    </section>
  );
}

function JourneyBuilder() {
  return (
    <section className="bg-[#0C1833] text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 lg:grid-cols-[0.8fr_1.2fr] lg:px-8 lg:py-16">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#F8C51C]">
            Guided support journey
          </p>
          <h2 className="mapable-display mt-3 text-4xl font-black leading-[1.02] tracking-[-0.055em] md:text-5xl">
            One journey, not five separate searches.
          </h2>
          <p className="mt-4 text-base leading-8 text-white/75">
            Competitors help you find support workers. MapAble makes the surrounding journey easier
            too: transport, access notes, NDIS help and human support.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {journeySteps.map((step) => (
            <article
              key={step.number}
              className="rounded-[1.5rem] border border-white/15 bg-white/10 p-5 backdrop-blur"
            >
              <p className="mapable-display text-3xl font-black tracking-[-0.05em] text-[#F8C51C]">
                {step.number}
              </p>
              <h3 className="mt-4 text-lg font-black text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/72">{step.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function MarketplaceGrid() {
  return (
    <section id="find-support" className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
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
              className="group rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/80 focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
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
      <Hero />
      <TrustMetrics />
      <JourneyBuilder />
      <MarketplaceGrid />
      <MapAbleDifference />
      <PartnerStrip />
      <TrustAndSafetyBand />
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
