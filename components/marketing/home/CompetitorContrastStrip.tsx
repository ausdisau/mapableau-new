import React from "react";

import { competitorContrastCards } from "@/lib/marketing/mapable-care-combined-data";

/**
 * Marketing proof strip — evidence of differentiation without “Coming soon”
 * metrics or card chrome.
 */
export function CompetitorContrastStrip() {
  return (
    <section
      aria-labelledby="contrast-heading"
      className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-16"
    >
      <p className="text-sm font-black uppercase tracking-[0.18em] text-mapable-primary">
        Why MapAble
      </p>
      <h2
        id="contrast-heading"
        className="mt-3 max-w-3xl font-heading text-3xl font-black tracking-[-0.04em] text-mapable-text md:text-5xl"
      >
        Accessibility proof, not another directory.
      </h2>
      <p className="mt-4 max-w-2xl text-lg leading-[1.65] text-mapable-text-muted">
        MapAble publishes access detail, confidence, and practical next steps so
        participants and providers can plan with clearer evidence.
      </p>
      <ol className="mt-10 divide-y divide-mapable-border border-y border-mapable-border">
        {competitorContrastCards.map((card, index) => (
          <li
            key={card.title}
            className="grid gap-3 py-6 md:grid-cols-[11rem_minmax(0,1fr)] md:gap-8"
          >
            <p className="text-xs font-black uppercase tracking-[0.14em] text-mapable-primary">
              {String(index + 1).padStart(2, "0")}
            </p>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-mapable-text-muted">
                {card.badge}
              </p>
              <h3 className="mt-2 font-heading text-xl font-black text-mapable-text md:text-2xl">
                {card.title}
              </h3>
              <p className="mt-2 max-w-2xl text-base leading-[1.65] text-mapable-text-muted">
                {card.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
