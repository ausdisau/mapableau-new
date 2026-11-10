import Link from "next/link";
import React from "react";

import { homepageFinalCta } from "@/lib/marketing/mapable-care-combined-data";
import {
  marketingGhostCtaClass,
  marketingOnDarkSolidCtaClass,
} from "@/lib/marketing/brand-palette";

/**
 * PDA-style membership/action band: roomy navy plane, centered copy, dual CTAs.
 */
export function HomepageFinalCta() {
  return (
    <section
      aria-labelledby="final-cta-heading"
      className="bg-[#0C1833] text-white"
    >
      <div className="mx-auto max-w-4xl px-5 py-16 text-center lg:px-8 lg:py-20">
        <h2
          id="final-cta-heading"
          className="text-3xl font-black tracking-[-0.04em] md:text-5xl"
        >
          {homepageFinalCta.headline}
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-200">
          {homepageFinalCta.body}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {homepageFinalCta.ctas.map((cta, index) => (
            <Link
              key={cta.href}
              href={cta.href}
              className={
                index === 0
                  ? marketingOnDarkSolidCtaClass
                  : marketingGhostCtaClass
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
