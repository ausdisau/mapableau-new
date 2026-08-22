import Link from "next/link";
import React from "react";

import { MapAbleJourneyVisual } from "@/components/marketing/brand/MapAbleJourneyVisual";
import { TrustStrip } from "@/components/marketing/home/TrustStrip";
import { ArrowIcon } from "@/components/marketing/mapable-care-icons";
import {
  homepageHeroCopy,
  homepageHeroCtas,
} from "@/lib/marketing/mapable-care-combined-data";
import {
  mapableCareCtaClass,
  mapableCareGhostCtaClass,
  mapableCareOutlineCtaClass,
} from "@/lib/marketing/mapable-care-tokens";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-mapable-surface">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1 mapable-brand-gradient"
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,0.45fr)] lg:gap-12 lg:px-8 lg:py-20">
        <div>
          <p className="text-sm font-semibold tracking-[0.04em] text-mapable-tagline">
            {homepageHeroCopy.eyebrow}
          </p>
          <h1 className="mt-3 max-w-xl font-heading text-4xl font-black leading-[1.05] tracking-[-0.04em] text-mapable-text md:text-6xl lg:text-7xl">
            {homepageHeroCopy.headline}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-[1.65] text-mapable-text-muted">
            {homepageHeroCopy.subheading}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {homepageHeroCtas.map((cta, index) => (
              <Link
                key={cta.href}
                href={cta.href}
                className={
                  index === 0
                    ? `${mapableCareCtaClass} gap-2`
                    : index === 1
                      ? mapableCareOutlineCtaClass
                      : mapableCareGhostCtaClass
                }
              >
                {cta.label}
                {index === 0 ? <ArrowIcon /> : null}
              </Link>
            ))}
          </div>
          <TrustStrip />
        </div>
        <div className="flex justify-center" aria-hidden="true">
          <MapAbleJourneyVisual className="h-auto w-full max-w-[22rem] lg:max-w-[28rem]" />
        </div>
      </div>
    </section>
  );
}
