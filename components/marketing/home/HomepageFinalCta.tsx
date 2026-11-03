import Link from "next/link";
import React from "react";

import { homepageFinalCta } from "@/lib/marketing/mapable-care-combined-data";
import {
  marketingGhostCtaClass,
  marketingPrimaryCtaClass,
} from "@/lib/marketing/brand-palette";

export function HomepageFinalCta() {
  return (
    <section
      aria-labelledby="final-cta-heading"
      className="bg-[#0C1833] text-white"
    >
      <div className="mx-auto max-w-[72rem] px-5 py-14 lg:px-8 lg:py-16">
        <h2
          id="final-cta-heading"
          className="max-w-3xl text-3xl font-black tracking-[-0.04em] md:text-5xl"
        >
          {homepageFinalCta.headline}
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200">
          {homepageFinalCta.body}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {homepageFinalCta.ctas.map((cta, index) => (
            <Link
              key={cta.href}
              href={cta.href}
              className={
                index === 0 ? marketingPrimaryCtaClass : marketingGhostCtaClass
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
