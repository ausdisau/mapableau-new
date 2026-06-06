"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useMemo, useState, type ReactNode } from "react";

import { ArrowIcon, ChevronDown, SearchIcon } from "@/components/marketing/mapable-care-icons";
import {
  getFilteredResults,
  getPredictiveSuggestions,
  getSponsoredPlacement,
  logoMenuItems,
  supportAreas,
  type SearchResult,
  type SponsoredPlacement,
  type SupportArea,
} from "@/lib/marketing/mapable-care-combined-data";
import { buildGuidedSearchUrl } from "@/lib/marketing/mapable-care-routes";

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

export function LogoMark({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#005B7F] text-white shadow-sm">
        <div className="h-4 w-4 rounded-b-full rounded-tl-full bg-white" />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-12 w-12 shrink-0">
        <div className="absolute left-3 top-0 h-8 w-8 rotate-45 rounded-bl-full rounded-t-full bg-[#005B7F] shadow-sm" />
        <div className="absolute left-4 top-1.5 text-sm font-black text-white">♿</div>
        <div className="absolute bottom-1 left-0 h-5 w-8 -rotate-[28deg] rounded-sm bg-[#00A979]" />
        <div className="absolute bottom-1 left-4 h-5 w-9 rotate-[28deg] rounded-sm bg-[#005B7F]" />
        <div className="absolute bottom-0 right-0 h-4 w-7 rotate-[12deg] rounded-sm bg-[#F8C51C]" />
      </div>
      <div>
        <div className="mapable-display text-3xl font-black tracking-[-0.07em] text-[#005B7F]">
          MapAble
        </div>
        <div className="mapable-soft -mt-1 rotate-[-1deg] text-xs font-black tracking-wide text-[#F8C51C]">
          Empowering Independence
        </div>
      </div>
    </div>
  );
}

export function LogoMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex min-w-fit items-center gap-1">
      <Link
        href="/"
        className="rounded-2xl p-1 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
        onClick={() => setOpen(false)}
      >
        <span className="sr-only">MapAble home</span>
        <LogoMark />
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

export function ResultRow({ result }: { result: SearchResult }) {
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

export function SponsoredBadge({ children = "Sponsored partner" }: { children?: ReactNode }) {
  return (
    <span className="inline-flex w-fit rounded-full border border-[#005B7F]/20 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#005B7F]">
      {children}
    </span>
  );
}

export function SponsoredCard({
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

export function GuidedSearch() {
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

export function MapAbleCareMarketingHeader() {
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
