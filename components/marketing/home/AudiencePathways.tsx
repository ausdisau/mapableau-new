import Link from "next/link";
import React from "react";

import { homepageAudiencePathways } from "@/lib/marketing/mapable-care-combined-data";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

export function AudiencePathways() {
  return (
    <section
      aria-labelledby="audience-pathways-heading"
      className="border-y border-mapable-border bg-mapable-surface"
    >
      <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-16">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-mapable-primary">
          Start where you are
        </p>
        <h2
          id="audience-pathways-heading"
          className="mt-3 max-w-3xl font-heading text-3xl font-black tracking-[-0.04em] text-mapable-text md:text-5xl"
        >
          What brings you to MapAble?
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-[1.65] text-mapable-text-muted">
          Choose a pathway. You review options and confirm next steps — MapAble
          does not assign support, jobs, or transport on your behalf.
        </p>
        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          {homepageAudiencePathways.map((group) => (
            <div key={group.heading}>
              <h3 className="text-sm font-black uppercase tracking-[0.12em] text-mapable-primary">
                {group.heading}
              </h3>
              <ul className="mt-4 divide-y divide-mapable-border border-y border-mapable-border">
                {group.items.map((item) => (
                  <li key={item.title}>
                    <Link
                      href={item.href}
                      className={`block py-4 ${mapableCareFocusRing} rounded-xl`}
                    >
                      <span className="block text-base font-black text-mapable-text">
                        {item.title}
                      </span>
                      <span className="mt-1 block text-sm leading-[1.6] text-mapable-text-muted">
                        {item.description}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
