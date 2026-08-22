import Link from "next/link";
import React from "react";

import { homepageFinalCta } from "@/lib/marketing/mapable-care-combined-data";
import {
  mapableCareCtaClass,
  mapableCareFocusRing,
} from "@/lib/marketing/mapable-care-tokens";

export function HomepageFinalCta() {
  return (
    <section
      aria-labelledby="final-cta-heading"
      className="bg-mapable-navy text-white"
    >
      <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-16">
        <h2
          id="final-cta-heading"
          className="max-w-3xl font-heading text-3xl font-black tracking-[-0.04em] md:text-5xl"
        >
          {homepageFinalCta.headline}
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-[1.65] text-slate-200">
          {homepageFinalCta.body}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {homepageFinalCta.ctas.map((cta, index) => (
            <Link
              key={cta.href}
              href={cta.href}
              className={
                index === 0
                  ? `${mapableCareCtaClass} bg-white text-mapable-primary hover:bg-mapable-surface`
                  : `inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/40 px-5 py-3 text-sm font-black text-white hover:bg-white/10 ${mapableCareFocusRing}`
              }
            >
              {cta.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
