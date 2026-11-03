import Link from "next/link";
import React from "react";

import { TrustStrip } from "@/components/marketing/home/TrustStrip";
import { ArrowIcon } from "@/components/marketing/mapable-care-icons";
import { WavyText } from "@/components/marketing/MapAbleCareTypography";
import {
  marketingEyebrowClass,
  marketingOutlineCtaClass,
  marketingPrimaryCtaClass,
} from "@/lib/marketing/brand-palette";
import {
  homepageHeroCopy,
  homepageHeroCtas,
} from "@/lib/marketing/mapable-care-combined-data";

const ctaClasses = [
  `${marketingPrimaryCtaClass} gap-2 px-6 text-base`,
  `${marketingOutlineCtaClass} gap-2 px-6 text-base`,
  `${marketingOutlineCtaClass} gap-2 px-6 text-base`,
] as const;

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#F7F8FC]">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(242,106,33,0.28),_transparent_52%),radial-gradient(ellipse_at_bottom_left,_rgba(59,91,219,0.22),_transparent_48%),radial-gradient(ellipse_at_center,_rgba(139,77,255,0.14),_transparent_55%)]"
      />
      <div
        aria-hidden="true"
        className="absolute right-[-10rem] top-[-6rem] h-[28rem] w-[28rem] animate-[pulse_9s_ease-in-out_infinite] rounded-full bg-[#8B4DFF]/20 blur-3xl motion-reduce:animate-none motion-reduce:blur-none"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-[-12rem] left-[-8rem] h-[30rem] w-[30rem] animate-[pulse_11s_ease-in-out_infinite] rounded-full bg-[#3B5BDB]/16 blur-3xl motion-reduce:animate-none motion-reduce:blur-none"
      />
      <div className="relative mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
        <p
          className={`${marketingEyebrowClass} mb-4 border-none bg-transparent px-0 text-sm tracking-[0.18em]`}
        >
          MapAble Australia
        </p>
        <h1
          aria-label={homepageHeroCopy.headline}
          className="mapable-display max-w-4xl text-4xl font-black leading-[0.98] tracking-[-0.045em] text-[#0C1833] md:text-6xl lg:text-7xl"
        >
          <WavyText text={homepageHeroCopy.headline} />
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
          {homepageHeroCopy.subheading}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {homepageHeroCtas.map((cta, index) => (
            <Link
              key={cta.href}
              href={cta.href}
              className={`${ctaClasses[index] ?? marketingOutlineCtaClass} w-full sm:w-auto`}
            >
              {cta.label}
              {index === 0 ? <ArrowIcon /> : null}
            </Link>
          ))}
        </div>
        <TrustStrip />
      </div>
    </section>
  );
}
