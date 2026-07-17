"use client";

import Link from "next/link";
import React, { useEffect, useRef } from "react";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import { mapablePublicCardClass } from "@/lib/marketing/public-page-styles";
import {
  formatAccessGuideStatusKey,
  type AccessGuide,
} from "@/lib/resources/access-guides-data";

type GuideListProps = {
  guides: AccessGuide[];
  selectedGuideId: string | null;
  isFiltered: boolean;
  onSelectGuide: (guideId: string) => void;
};

function GuideCard({
  guide,
  selected,
  onSelect,
}: {
  guide: AccessGuide;
  selected: boolean;
  onSelect: () => void;
}) {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!selected || !ref.current) return;
    if (typeof ref.current.scrollIntoView !== "function") return;
    const media =
      typeof window !== "undefined" && typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;
    ref.current.scrollIntoView({
      block: "nearest",
      behavior: media?.matches ? "auto" : "smooth",
    });
  }, [selected]);

  return (
    <Link
      ref={ref}
      id={`guide-card-${guide.id}`}
      href={guide.href}
      aria-current={selected ? "true" : undefined}
      onFocus={onSelect}
      onClick={onSelect}
      className={`${mapablePublicCardClass} block transition hover:border-[#005B7F]/30 hover:shadow-sm motion-reduce:transform-none ${mapableCareFocusRing} ${
        selected
          ? "border-[#005B7F] ring-4 ring-[#F8C51C]/40"
          : "border-slate-200"
      }`}
    >
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#005B7F]">
        {guide.state} · {guide.guideType} · {guide.tier}
      </p>
      <h3 className="mt-2 text-lg font-black text-[#0C1833]">{guide.city}</h3>
      <p className="mt-2 text-xs font-semibold text-slate-500">
        {formatAccessGuideStatusKey(guide.statusKey)}
      </p>
      <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-700">
        {guide.summary}
      </p>
    </Link>
  );
}

export function GuideList({
  guides,
  selectedGuideId,
  isFiltered,
  onSelectGuide,
}: GuideListProps) {
  if (isFiltered) {
    return (
      <section
        id="guides-list"
        aria-labelledby="guides-list-heading"
        className="scroll-mt-24"
      >
        <h2
          id="guides-list-heading"
          className="text-2xl font-black tracking-tight text-mapable-navy sm:text-3xl"
        >
          Matching Access Guides
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          {guides.length} guide{guides.length === 1 ? "" : "s"} match your
          search and filters.
        </p>
        {guides.length === 0 ? (
          <p className="mt-6 text-sm leading-7 text-slate-700">
            No guides match those filters yet. Clear a filter to browse again.
          </p>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((guide) => (
              <GuideCard
                key={guide.id}
                guide={guide}
                selected={selectedGuideId === guide.id}
                onSelect={() => onSelectGuide(guide.id)}
              />
            ))}
          </div>
        )}
      </section>
    );
  }

  const capitals = guides.filter((g) => g.priorityTier === "Capital launch");
  const tiers = ["Tier 1", "Tier 2", "Tier 3"] as const;

  return (
    <div id="guides-list" className="space-y-12 scroll-mt-24">
      <section aria-labelledby="guides-capital-list-heading">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-mapable-brand">
          Capital launch
        </p>
        <h2
          id="guides-capital-list-heading"
          className="mt-2 text-2xl font-black tracking-tight text-mapable-navy sm:text-3xl"
        >
          Capital Access Guides
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          {capitals.length} capital starter guides. Select a card or map marker
          to open the guide.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {capitals.map((guide) => (
            <GuideCard
              key={guide.id}
              guide={guide}
              selected={selectedGuideId === guide.id}
              onSelect={() => onSelectGuide(guide.id)}
            />
          ))}
        </div>
      </section>

      {tiers.map((tier) => {
        const tierGuides = guides.filter((g) => g.priorityTier === tier);
        if (tierGuides.length === 0) return null;
        const headingId = `guides-${tier.toLowerCase().replace(/\s+/g, "-")}-list-heading`;
        return (
          <section key={tier} aria-labelledby={headingId}>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-mapable-brand">
              {tier}
            </p>
            <h2
              id={headingId}
              className="mt-2 text-2xl font-black tracking-tight text-mapable-navy sm:text-3xl"
            >
              {tier} regional Access Guides
            </h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              {tierGuides.length} locations scheduled for local verification.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tierGuides.map((guide) => (
                <GuideCard
                  key={guide.id}
                  guide={guide}
                  selected={selectedGuideId === guide.id}
                  onSelect={() => onSelectGuide(guide.id)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
