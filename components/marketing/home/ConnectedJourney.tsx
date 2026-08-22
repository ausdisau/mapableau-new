import React from "react";

import { homepageSupportJourneySteps } from "@/lib/marketing/mapable-care-combined-data";

export function ConnectedJourney() {
  return (
    <section
      aria-labelledby="connected-journey-heading"
      className="relative overflow-hidden bg-white"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1 mapable-brand-gradient"
      />
      <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-16">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-mapable-primary">
          Connected support
        </p>
        <h2
          id="connected-journey-heading"
          className="mt-3 max-w-3xl font-heading text-3xl font-black tracking-[-0.04em] text-mapable-text md:text-5xl"
        >
          One journey. Connected support.
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-[1.65] text-mapable-text-muted">
          MapAble connects information and services so you can explore, compare,
          and confirm. It does not autonomously make participant decisions.
        </p>
        <ol className="relative mt-10 grid gap-0 border-l-2 border-mapable-border pl-6 md:border-l-0 md:pl-0 lg:grid-cols-6">
          <svg
            aria-hidden="true"
            focusable="false"
            viewBox="0 0 1200 24"
            className="pointer-events-none absolute left-0 right-0 top-5 hidden h-6 w-full lg:block"
          >
            <path
              d="M40 14 C 220 4, 400 22, 600 10 S 980 4, 1160 16"
              fill="none"
              stroke="#DDE7EE"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
          {homepageSupportJourneySteps.map((step) => (
            <li key={step.number} className="relative py-4 lg:px-2 lg:py-0">
              <p className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-mapable-primary/20 bg-mapable-surface-blue text-xs font-black text-mapable-primary">
                {step.number}
              </p>
              <h3 className="mt-3 font-heading text-lg font-black text-mapable-text">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-[1.65] text-mapable-text-muted">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
