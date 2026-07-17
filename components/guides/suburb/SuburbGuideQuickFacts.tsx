import React from "react";

import { SuburbGuideStatusBadge } from "@/components/guides/suburb/SuburbGuideStatusBadge";
import { mapablePublicCardClass } from "@/lib/marketing/public-page-styles";
import { formatSuburbAccessTheme } from "@/lib/resources/suburb-access-guides-data";
import type { SuburbAccessGuide } from "@/types/suburb-access-guide";

type SuburbGuideQuickFactsProps = {
  guide: SuburbAccessGuide;
};

export function SuburbGuideQuickFacts({ guide }: SuburbGuideQuickFactsProps) {
  const facts = [
    { label: "SAL code", value: guide.salCode },
    { label: "State", value: guide.state },
    {
      label: "LGA",
      value: guide.lgaNames.join(", ") || "Not listed yet",
    },
    { label: "Confidence", value: `${guide.confidenceScore}/100` },
    { label: "Last updated", value: guide.lastUpdated },
    {
      label: "Last verified",
      value: guide.lastVerified ?? "Not verified yet",
    },
  ];

  return (
    <section aria-labelledby="suburb-quick-facts-heading">
      <div className="flex flex-wrap items-center gap-3">
        <h2
          id="suburb-quick-facts-heading"
          className="text-lg font-black text-[#0C1833] sm:text-xl"
        >
          Quick facts
        </h2>
        <SuburbGuideStatusBadge status={guide.guideStatus} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {facts.map((fact) => (
          <div key={fact.label} className={mapablePublicCardClass}>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#005B7F]">
              {fact.label}
            </p>
            <p className="mt-2 text-sm font-semibold leading-7 text-[#0C1833]">
              {fact.value}
            </p>
          </div>
        ))}
      </div>
      {guide.accessThemes.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {guide.accessThemes.map((theme) => (
            <li
              key={theme}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#005B7F]"
            >
              {formatSuburbAccessTheme(theme)}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
