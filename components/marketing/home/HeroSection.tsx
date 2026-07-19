import Link from "next/link";
import React from "react";

import { HashScrollOffset } from "@/components/marketing/home/HashScrollOffset";
import { TrustStrip } from "@/components/marketing/home/TrustStrip";
import { ArrowIcon } from "@/components/marketing/mapable-care-icons";
import { WavyText } from "@/components/marketing/MapAbleCareTypography";
import {
  homepageCategoryChips,
  homepageHeroCopy,
  homepageHeroCtas,
  homepageHeroTertiaryLinks,
} from "@/lib/marketing/mapable-care-combined-data";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

export function HeroSection() {
  const primary = homepageHeroCtas.find((cta) => cta.priority === "primary");
  const secondary = homepageHeroCtas.find((cta) => cta.priority === "secondary");

  return (
    <section className="relative overflow-hidden bg-[#F6FBFC]">
      <HashScrollOffset />
      <div
        className="absolute right-[-8rem] top-[-8rem] h-80 w-80 rounded-full bg-[#F8C51C]/30 blur-3xl motion-reduce:blur-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-[-10rem] left-[-8rem] h-96 w-96 rounded-full bg-[#00A979]/15 blur-3xl motion-reduce:blur-none"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#005B7F]">
          MapAble
        </p>
        <h1 className="mt-3 max-w-5xl text-4xl font-black leading-[0.98] tracking-[-0.045em] text-[#0C1833] md:text-6xl lg:text-7xl">
          <WavyText text={homepageHeroCopy.headline} />
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
          {homepageHeroCopy.subheading}
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          {primary ? (
            <Link
              href={primary.href}
              className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#005B7F] px-6 py-4 text-center text-sm font-black text-white shadow-sm transition hover:bg-[#004766] ${mapableCareFocusRing}`}
            >
              {primary.label}
              <ArrowIcon />
            </Link>
          ) : null}
          {secondary ? (
            <Link
              href={secondary.href}
              className={`inline-flex min-h-12 items-center justify-center rounded-2xl border-2 border-[#0C1833] bg-white/70 px-6 py-4 text-center text-sm font-black text-[#0C1833] transition hover:bg-white ${mapableCareFocusRing}`}
            >
              {secondary.label}
            </Link>
          ) : null}
        </div>
        <nav
          aria-label="More ways to get started"
          className="mt-5 flex flex-wrap gap-x-4 gap-y-2"
        >
          {homepageHeroTertiaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`min-h-11 text-sm font-bold text-[#005B7F] underline-offset-2 hover:underline ${mapableCareFocusRing}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <TrustStrip />
        <div className="mt-8 border-t border-slate-200/80 pt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Explore by area
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {homepageCategoryChips.map((chip) => (
              <li key={chip.label}>
                <Link
                  href={chip.href}
                  className={`inline-flex min-h-11 items-center rounded-full bg-white/80 px-4 py-3 text-sm font-black text-[#005B7F] shadow-sm ring-1 ring-slate-200 transition hover:bg-white hover:ring-[#005B7F]/30 ${mapableCareFocusRing}`}
                >
                  {chip.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
