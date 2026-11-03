import Link from "next/link";
import React from "react";

import { homepageAudienceCards } from "@/lib/marketing/mapable-care-combined-data";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

/** Who MapAble is for — participants, providers, support coordinators. */
export function HomepageAudienceSection() {
  return (
    <section
      aria-labelledby="audience-heading"
      className="border-y border-slate-200 bg-[#F6FBFC]"
    >
      <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-14">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#005B7F]">
          Who it&apos;s for
        </p>
        <h2
          id="audience-heading"
          className="mt-3 max-w-3xl text-3xl font-black tracking-[-0.04em] text-[#0C1833] md:text-4xl"
        >
          Built for people planning access — not another marketplace pitch.
        </h2>
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {homepageAudienceCards.map((card) => (
            <li
              key={card.title}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6"
            >
              <h3 className="text-lg font-black text-[#0C1833]">{card.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
                {card.body}
              </p>
              <Link
                href={card.href}
                className={`mt-5 inline-flex min-h-11 items-center text-sm font-black text-[#005B7F] underline-offset-4 hover:underline ${mapableCareFocusRing}`}
              >
                {card.cta}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
