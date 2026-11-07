import Link from "next/link";
import React from "react";

import { TrustStrip } from "@/components/marketing/home/TrustStrip";
import { ArrowIcon } from "@/components/marketing/mapable-care-icons";
import { WavyText } from "@/components/marketing/MapAbleCareTypography";
import {
  marketingGhostCtaClass,
  marketingOnDarkSolidCtaClass,
} from "@/lib/marketing/brand-palette";
import {
  homepageHeroCopy,
  homepageHeroCtas,
} from "@/lib/marketing/mapable-care-combined-data";

/**
 * PDA-inspired full-bleed hero: atmospheric plane, white type on dark overlay,
 * solid + ghost dual CTAs. MapAble palette (navy/orange/violet) — not PDA purple.
 */
export function HeroSection() {
  return (
    <section className="marketing-pda-hero relative overflow-hidden text-white">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[#0C1833]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,_rgba(59,91,219,0.55),_transparent_55%),radial-gradient(ellipse_at_15%_80%,_rgba(139,77,255,0.32),_transparent_50%),radial-gradient(ellipse_at_85%_75%,_rgba(242,106,33,0.28),_transparent_45%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-[#0C1833] via-[#0C1833]/55 to-transparent"
      />
      <div className="relative mx-auto flex min-h-[28rem] max-w-7xl flex-col justify-end px-5 pb-14 pt-20 sm:min-h-[32rem] lg:min-h-[36rem] lg:px-8 lg:pb-16 lg:pt-24">
        <p className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-[#F26A21]">
          MapAble Australia
        </p>
        <h1
          aria-label={homepageHeroCopy.headline}
          className="mapable-display max-w-4xl text-4xl font-black leading-[0.98] tracking-[-0.045em] text-white md:text-6xl lg:text-7xl"
        >
          <WavyText text={homepageHeroCopy.headline} />
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-white/85">
          {homepageHeroCopy.subheading}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {homepageHeroCtas.map((cta, index) => (
            <Link
              key={cta.href}
              href={cta.href}
              className={`${
                index === 0
                  ? marketingOnDarkSolidCtaClass
                  : marketingGhostCtaClass
              } gap-2 px-7 text-base`}
            >
              {cta.label}
              {index === 0 ? <ArrowIcon /> : null}
            </Link>
          ))}
        </div>
        <div className="mt-8 border-t border-white/15 pt-6">
          <TrustStrip tone="onDark" />
        </div>
      </div>
    </section>
  );
}
