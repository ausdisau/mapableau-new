import Link from "next/link";
import React from "react";

import { TrustStrip } from "@/components/marketing/home/TrustStrip";
import { ArrowIcon } from "@/components/marketing/mapable-care-icons";
import { WavyText } from "@/components/marketing/MapAbleCareTypography";
import {
  homepageHeroCopy,
  homepageHeroCtas,
} from "@/lib/marketing/mapable-care-combined-data";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#F6FBFC]">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(248,197,28,0.28),_transparent_55%),radial-gradient(ellipse_at_bottom_left,_rgba(0,91,127,0.18),_transparent_50%)]"
      />
      <div
        aria-hidden="true"
        className="absolute right-[-8rem] top-[-8rem] h-80 w-80 animate-[pulse_8s_ease-in-out_infinite] rounded-full bg-[#F8C51C]/25 blur-3xl motion-reduce:animate-none motion-reduce:blur-none"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-[-10rem] left-[-8rem] h-96 w-96 animate-[pulse_10s_ease-in-out_infinite] rounded-full bg-[#00A979]/15 blur-3xl motion-reduce:animate-none motion-reduce:blur-none"
      />
      <div className="relative mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-[#005B7F]">
          MapAble
        </p>
        <h1
          aria-label={homepageHeroCopy.headline}
          className="mt-4 max-w-4xl text-4xl font-black leading-[0.98] tracking-[-0.045em] text-[#0C1833] md:text-6xl lg:text-7xl"
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
              className={
                index === 0
                  ? `inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#005B7F] px-6 py-4 text-center text-sm font-black text-white shadow-sm transition hover:bg-[#004766] ${mapableCareFocusRing}`
                  : `inline-flex min-h-12 items-center justify-center rounded-2xl border-2 border-[#0C1833] bg-white/70 px-6 py-4 text-center text-sm font-black text-[#0C1833] transition hover:bg-white ${mapableCareFocusRing}`
              }
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
