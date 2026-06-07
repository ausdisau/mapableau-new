"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useMemo, useState, type CSSProperties, type ReactNode } from "react";

import {
  companyRegistrationDetails,
  differenceCards,
  footerPlatformLinks,
  footerResourceLinks,
  getFilteredResults,
  getPredictiveSuggestions,
  getSponsoredPlacement,
  journeySteps,
  logoMenuItems,
  MAPABLE_CARE_COMBINED_PHONE,
  marketplaceCards,
  sampleResults,
  sponsoredPlacements,
  supportAreas,
  trustMetrics,
  type SearchResult,
  type SponsoredPlacement,
  type SupportArea,
} from "@/lib/marketing/mapable-care-combined-data";
import { buildGuidedSearchUrl } from "@/lib/marketing/mapable-care-routes";
import {
  MAPABLE_LOGO_ALT,
  MAPABLE_LOGO_SRC,
  MAPABLE_SUPPORT_EMAIL,
} from "@/lib/brand/constants";

export { mapAbleCareCombinedDesignTests } from "@/lib/marketing/mapable-care-combined-data";

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="m21 21-4.3-4.3M10.8 18.2a7.4 7.4 0 1 1 0-14.8 7.4 7.4 0 0 1 0 14.8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

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

function ChevronDown() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path
        d="M5.5 7.5 10 12l4.5-4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path
        d="M4 10h11m0 0-4-4m4 4-4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TypographyStyles() {
  return (
    <style>{`
      .mapable-display {
        font-family: ui-rounded, "Arial Rounded MT Bold", "Trebuchet MS", system-ui, sans-serif;
        letter-spacing: -0.045em;
        text-wrap: balance;
      }
      .mapable-soft {
        font-family: "Trebuchet MS", ui-rounded, system-ui, sans-serif;
      }
      .mapable-wavy-letter {
        display: inline-block;
        transform: translateY(var(--wave-y, 0em)) rotate(var(--wave-r, 0deg));
        transform-origin: 50% 80%;
      }
      .mapable-wavy-word {
        display: inline-block;
        white-space: nowrap;
        margin-right: 0.34em;
      }
    `}</style>
  );
}

function WavyText({ text, className = "" }: { text: string; className?: string }) {
  let letterIndex = 0;
  return (
    <span aria-label={text} className={`mapable-display ${className}`}>
      {text.split(" ").map((word, wordIndex) => (
        <span key={`${word}-${wordIndex}`} aria-hidden="true" className="mapable-wavy-word">
          {word.split("").map((letter) => {
            const y = ["0em", "-0.045em", "0.025em", "-0.03em", "0.04em"][letterIndex % 5];
            const r = ["-1.8deg", "1.15deg", "-0.75deg", "1.6deg", "-1.1deg"][letterIndex % 5];
            letterIndex += 1;
            return (
              <span
                key={`${letter}-${letterIndex}`}
                className="mapable-wavy-letter"
                style={
                  {
                    "--wave-y": y,
                    "--wave-r": r,
                  } as CSSProperties
                }
              >
                {letter}
              </span>
            );
          })}
        </span>
      ))}
    </span>
  );
}

function OfficialLogoImage({ className }: { className?: string }) {
  return (
    <img
      src={MAPABLE_LOGO_SRC}
      alt={MAPABLE_LOGO_ALT}
      className={className}
      decoding="async"
      fetchPriority="high"
    />
  );
}

function LogoMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex min-w-fit items-center gap-1">
      <Link
        href="/"
        className="rounded-2xl p-1 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
        onClick={() => setOpen(false)}
      >
        <span className="sr-only">MapAble home</span>
        <OfficialLogoImage className="h-11 w-auto max-w-[min(280px,72vw)] bg-transparent object-contain object-left sm:h-12" />
      </Link>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="rounded-full bg-slate-100 p-2 text-[#005B7F] transition hover:bg-slate-200 focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
      >
        <span className="sr-only">Open MapAble menu</span>
        <ChevronDown />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 top-[calc(100%+0.75rem)] z-[60] w-[min(92vw,27rem)] overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white shadow-2xl shadow-slate-300/50"
        >
          <div className="border-b border-slate-100 bg-[#005B7F] p-4 text-white">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">MapAble menu</p>
            <p className="mt-1 text-lg font-black">Care, support and access in one place.</p>
          </div>
          <div className="grid gap-1 p-2">
            {logoMenuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="rounded-2xl px-4 py-3 transition hover:bg-[#F8C51C]/20 focus:bg-[#F8C51C]/20 focus:outline-none"
              >
                <span className="block text-sm font-black text-[#0C1833]">{item.label}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-600">{item.description}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SupportAreaCombo({
  selectedArea,
  setSelectedArea,
}: {
  selectedArea: SupportArea;
  setSelectedArea: (value: SupportArea) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative hidden sm:block">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="inline-flex h-9 max-w-[11rem] items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 text-xs font-black text-[#0C1833] transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
      >
        <span className="truncate">{selectedArea}</span>
        <ChevronDown />
      </button>
      {open && (
        <div
          role="listbox"
          aria-label="Choose support area"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-[70] w-[min(88vw,18rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-2xl shadow-slate-300/50"
        >
          <div className="px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            Support area
          </div>
          {supportAreas.map((area) => {
            const selected = selectedArea === area;
            const optionClassName = selected
              ? "w-full rounded-xl bg-[#005B7F]/10 px-3 py-3 text-left text-sm font-black text-[#005B7F] focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
              : "w-full rounded-xl px-3 py-3 text-left text-sm font-black text-[#0C1833] transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40";
            return (
              <button
                key={area}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  setSelectedArea(area);
                  setOpen(false);
                }}
                className={optionClassName}
              >
                {area}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ResultRow({ result }: { result: SearchResult }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-black text-[#0C1833]">{result.title}</h3>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#005B7F]">
          {result.category}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{result.description}</p>
      <Link
        href={result.href}
        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-black text-[#005B7F] transition hover:bg-[#F8C51C]/20 focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
      >
        {result.action} <ArrowIcon />
      </Link>
    </article>
  );
}

function SponsoredBadge({ children = "Sponsored partner" }: { children?: ReactNode }) {
  return (
    <span className="inline-flex w-fit rounded-full border border-[#005B7F]/20 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#005B7F]">
      {children}
    </span>
  );
}

function SponsoredCard({
  placement,
  compact = false,
}: {
  placement: SponsoredPlacement;
  compact?: boolean;
}) {
  const cardClassName = compact
    ? "rounded-2xl border border-[#005B7F]/15 bg-[#F6FBFC] p-4"
    : "rounded-[1.5rem] border border-[#005B7F]/15 bg-white p-5 shadow-sm";
  return (
    <article className={cardClassName}>
      <SponsoredBadge>{placement.category}</SponsoredBadge>
      <h3 className="mapable-display mt-3 text-lg font-black tracking-[-0.04em] text-[#0C1833]">
        {placement.title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{placement.description}</p>
      <Link
        href={placement.href}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#005B7F] px-4 py-2 text-sm font-black text-white transition hover:bg-[#004766] focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
      >
        {placement.cta} <ArrowIcon />
      </Link>
    </article>
  );
}

function GuidedSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedArea, setSelectedArea] = useState<SupportArea>("All");
  const [open, setOpen] = useState(false);
  const [submittedQuery, setSubmittedQuery] = useState("");
  const suggestions = useMemo(() => getPredictiveSuggestions(query), [query]);
  const results = useMemo(
    () => getFilteredResults(submittedQuery || query, selectedArea),
    [query, selectedArea, submittedQuery],
  );
  const sponsoredSearchPlacement = getSponsoredPlacement(selectedArea, "search");

  function runSearch(nextQuery = query) {
    setSubmittedQuery(nextQuery);
    setOpen(true);
  }

  function navigateToFinder(nextQuery = query) {
    router.push(buildGuidedSearchUrl(nextQuery, selectedArea));
  }

  return (
    <div className="relative w-full max-w-2xl">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          runSearch(query);
          navigateToFinder(query);
        }}
      >
        <label htmlFor="mapable-care-search" className="sr-only">
          Search MapAble
        </label>
        <div className="flex min-h-12 items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-3 shadow-sm transition focus-within:border-[#005B7F] focus-within:ring-4 focus-within:ring-[#F8C51C]/30">
          <span className="text-[#005B7F]">
            <SearchIcon />
          </span>
          <input
            id="mapable-care-search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="What support do you need today?"
            className="h-11 min-w-0 flex-1 bg-transparent text-sm font-bold text-[#0C1833] outline-none placeholder:text-slate-400"
          />
          <SupportAreaCombo selectedArea={selectedArea} setSelectedArea={setSelectedArea} />
          <button
            type="submit"
            className="rounded-xl bg-[#005B7F] px-4 py-2 text-sm font-black text-white transition hover:bg-[#004766] focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
          >
            Find
          </button>
        </div>
      </form>
      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.6rem)] z-50 max-h-[80vh] overflow-auto rounded-[1.4rem] border border-slate-200 bg-white shadow-2xl shadow-slate-300/50">
          <div className="border-b border-slate-100 p-3 sm:hidden">
            <div className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Support area
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {supportAreas.map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={() => setSelectedArea(area)}
                  className={
                    selectedArea === area
                      ? "rounded-full bg-[#005B7F] px-4 py-2 text-sm font-black text-white"
                      : "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-[#0C1833]"
                  }
                >
                  {area}
                </button>
              ))}
            </div>
          </div>
          <div className="border-b border-slate-100 p-3">
            <div className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Popular searches
            </div>
            <div className="grid gap-1">
              {suggestions.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    setQuery(prompt);
                    runSearch(prompt);
                    router.push(buildGuidedSearchUrl(prompt, selectedArea));
                  }}
                  className="rounded-xl px-3 py-3 text-left text-sm font-bold text-[#0C1833] transition hover:bg-[#F8C51C]/20 focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 p-3" aria-live="polite">
            <div className="rounded-2xl bg-[#005B7F]/10 p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#005B7F]">
                <SparkIcon /> Guided support
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                MapAble can help you compare options, understand next steps and connect with human
                support if you need it.
              </p>
            </div>
            {results.map((result) => (
              <ResultRow key={result.title} result={result} />
            ))}
            {sponsoredSearchPlacement && (
              <SponsoredCard placement={sponsoredSearchPlacement} compact />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 lg:px-8">
        <LogoMenu />
        <div className="hidden justify-center lg:flex">
          <GuidedSearch />
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="rounded-xl border-2 border-[#0C1833] px-5 py-3 text-sm font-black transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-[#005B7F] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#004766] focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
          >
            Get started
          </Link>
        </div>
      </div>
      <div className="border-t border-slate-100 px-5 pb-4 lg:hidden">
        <GuidedSearch />
      </div>
    </header>
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

function FooterTextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-lg text-sm font-medium text-slate-600 transition hover:text-[#005B7F] focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
    >
      {children}
    </Link>
  );
}

function SocialLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <a
      href={href}
      aria-label={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-black text-slate-600 transition hover:bg-white hover:text-[#005B7F] focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
    >
      {icon}
    </a>
  );
}

function FooterBrandMark() {
  return (
    <OfficialLogoImage className="h-10 w-auto max-w-[240px] bg-transparent object-contain object-left sm:h-11" />
  );
}

function AustralianDisabilityMark() {
  return (
    <div className="mt-5 rounded-2xl border border-slate-200 bg-white/60 p-4">
      <div className="flex items-center gap-3">
        <div className="text-3xl font-black leading-none tracking-tight">
          <span className="text-[#2F80C4]">A</span>
          <span className="text-[#2AA6B8]">D</span>
        </div>
        <div>
          <p className="text-sm font-black text-[#B98222]">Australian Disability</p>
          <p className="mt-1 max-w-xs text-xs leading-5 text-slate-600">
            We&apos;re for a fair, dignified and equal society for all people with disabilities.
          </p>
        </div>
      </div>
    </div>
  );
}

function RegistrationDetails() {
  return (
    <dl className="mt-5 grid gap-2 rounded-2xl border border-slate-200 bg-white/70 p-4 text-xs text-slate-600">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <dt className="font-black text-[#0C1833]">ABN:</dt>
        <dd>{companyRegistrationDetails.abn}</dd>
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <dt className="font-black text-[#0C1833]">NDIS Registration Number:</dt>
        <dd>{companyRegistrationDetails.ndisRegistrationNumber}</dd>
      </div>
    </dl>
  );
}

function FooterPartnerStrip() {
  const footerPlacements = sponsoredPlacements.filter((placement) => placement.placement === "footer");
  if (footerPlacements.length === 0) return null;
  return (
    <div className="mb-10 rounded-[1.5rem] border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <SponsoredBadge>Community partners</SponsoredBadge>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Partner placements are separated from support results and labelled for transparency.
          </p>
        </div>
        <div className="grid gap-3 md:min-w-[24rem]">
          {footerPlacements.map((placement) => (
            <Link
              key={placement.id}
              href={placement.href}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-[#F8C51C]/15 focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
            >
              <span className="block text-sm font-black text-[#0C1833]">{placement.title}</span>
              <span className="mt-1 block text-xs leading-5 text-slate-600">
                {placement.description}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50 text-[#0C1833]">
      <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
        <FooterPartnerStrip />
        <div className="grid gap-10 md:grid-cols-[1.2fr_0.9fr_0.9fr_1fr]">
          <section aria-label="About MapAble">
            <FooterBrandMark />
            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-600">
              A combined care and support platform helping people with disability connect with care,
              transport, opportunity and everyday access.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <SocialLink href="#facebook" label="Facebook" icon="f" />
              <SocialLink href="#x" label="X" icon="𝕏" />
              <SocialLink href="#instagram" label="Instagram" icon="◎" />
              <SocialLink href="#linkedin" label="LinkedIn" icon="in" />
            </div>
            <AustralianDisabilityMark />
            <RegistrationDetails />
          </section>
          <section aria-labelledby="footer-platform-heading">
            <h2 id="footer-platform-heading" className="text-sm font-black text-[#0C1833]">
              Platform
            </h2>
            <nav className="mt-5 grid gap-4" aria-label="Platform links">
              {footerPlatformLinks.map((item) => (
                <FooterTextLink key={item.href} href={item.href}>
                  {item.label}
                </FooterTextLink>
              ))}
            </nav>
          </section>
          <section aria-labelledby="footer-resources-heading">
            <h2 id="footer-resources-heading" className="text-sm font-black text-[#0C1833]">
              Resources
            </h2>
            <nav className="mt-5 grid gap-4" aria-label="Resource links">
              {footerResourceLinks.map((item) => (
                <FooterTextLink key={item.href} href={item.href}>
                  {item.label}
                </FooterTextLink>
              ))}
            </nav>
          </section>
          <section aria-labelledby="footer-contact-heading">
            <h2 id="footer-contact-heading" className="text-sm font-black text-[#0C1833]">
              Contact
            </h2>
            <address className="mt-5 grid gap-4 not-italic text-sm text-slate-600">
              <a
                href={`mailto:${MAPABLE_SUPPORT_EMAIL}`}
                className="rounded-lg transition hover:text-[#005B7F] focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
              >
                {MAPABLE_SUPPORT_EMAIL}
              </a>
              <a
                href="tel:0434083624"
                className="rounded-lg transition hover:text-[#005B7F] focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
              >
                {MAPABLE_CARE_COMBINED_PHONE}
              </a>
              <span>Sydney, Australia</span>
            </address>
          </section>
        </div>
        <div className="mt-10 flex flex-col gap-4 border-t border-slate-200 pt-7 text-xs text-slate-600 md:flex-row md:items-center md:justify-between">
          <p>© 2025 Australian Disability Ltd. All rights reserved.</p>
          <nav className="flex gap-6" aria-label="Legal links">
            <FooterTextLink href="/privacy">Privacy Policy</FooterTextLink>
            <FooterTextLink href="/terms">Terms of Service</FooterTextLink>
          </nav>
        </div>
      </div>
    </footer>
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

export function MapAbleCareMarketingTypography() {
  return <TypographyStyles />;
}

export function MapAbleCareMarketingHeader() {
  return <Header />;
}

export function MapAbleCareMarketingFooter() {
  return <Footer />;
}

export default function MapAbleCareCombinedHomepage() {
  return (
    <main id="main-content" className="mapable-soft flex min-h-screen flex-col bg-white text-[#0C1833]">
      <TypographyStyles />
      <Header />
      <MapAbleCareCombinedHomepageSections />
      <Footer />
    </main>
  );
}
