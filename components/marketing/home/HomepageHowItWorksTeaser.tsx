import Link from "next/link";
import React from "react";

import { howItWorksSteps } from "@/lib/marketing/mapable-care-combined-data";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

/** Homepage teaser — full journey lives on /how-it-works. */
export function HomepageHowItWorksTeaser() {
  const preview = howItWorksSteps.slice(0, 3);

  return (
    <section
      aria-labelledby="how-it-works-teaser-heading"
      className="bg-white"
    >
      <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-14">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#005B7F]">
          How a journey works
        </p>
        <h2
          id="how-it-works-teaser-heading"
          className="mt-3 max-w-3xl text-3xl font-black tracking-[-0.04em] text-[#0C1833] md:text-4xl"
        >
          Connect places, transport, and support planning — with consent you
          control.
        </h2>
        <ol className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
          {preview.map((step) => (
            <li
              key={step.number}
              className="grid gap-3 py-6 md:grid-cols-[7rem_minmax(0,1fr)] md:gap-8"
            >
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#005B7F]">
                {step.number}
              </p>
              <div>
                <h3 className="text-xl font-black text-[#0C1833]">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <Link
          href="/how-it-works"
          className={`mt-8 inline-flex min-h-11 items-center text-sm font-black text-[#005B7F] underline-offset-4 hover:underline ${mapableCareFocusRing}`}
        >
          See the full journey
        </Link>
      </div>
    </section>
  );
}
