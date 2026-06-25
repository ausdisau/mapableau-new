import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  mapablePublicCardClass,
  mapablePublicEyebrowClass,
  mapablePublicLeadClass,
  mapablePublicMutedCardClass,
  mapablePublicPageContainerClass,
  mapablePublicPrimaryButtonClass,
  mapablePublicSecondaryButtonClass,
  mapablePublicSectionTitleClass,
  mapablePublicTitleClass,
} from "@/lib/marketing/public-page-styles";

type CallToAction = {
  label: string;
  href: string;
};

export type VerticalLandingPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryCta: CallToAction;
  secondaryCta?: CallToAction;
  problem: {
    heading?: string;
    items: string[];
  };
  solution: {
    heading?: string;
    items: string[];
  };
  features?: {
    heading?: string;
    items: { title: string; description: string }[];
  };
  journey?: {
    heading?: string;
    body: string;
  };
  trustSection?: ReactNode;
  boundaryNotices?: ReactNode;
  ecosystemLinks?: ReactNode;
  interestForm?: ReactNode;
  extraSections?: ReactNode;
};

export function VerticalLandingPage({
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta,
  problem,
  solution,
  features,
  journey,
  trustSection,
  boundaryNotices,
  ecosystemLinks,
  interestForm,
  extraSections,
}: VerticalLandingPageProps) {
  return (
    <div className="bg-white text-[#0C1833]">
      <section className="relative overflow-hidden border-b border-slate-200 bg-[#F6FBFC]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-6rem] top-[-6rem] h-64 w-64 rounded-full bg-[#F8C51C]/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[-8rem] left-[-6rem] h-72 w-72 rounded-full bg-[#00A979]/10 blur-3xl"
        />
        <div className={`${mapablePublicPageContainerClass} relative py-14 sm:py-20`}>
          <div className="max-w-3xl">
            <p className={mapablePublicEyebrowClass}>{eyebrow}</p>
            <h1 className={`${mapablePublicTitleClass} mt-3`}>{title}</h1>
            <p className={mapablePublicLeadClass}>{description}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={primaryCta.href} className={mapablePublicPrimaryButtonClass}>
                {primaryCta.label}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              {secondaryCta ? (
                <Link href={secondaryCta.href} className={mapablePublicSecondaryButtonClass}>
                  {secondaryCta.label}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {boundaryNotices ? (
        <div className={`${mapablePublicPageContainerClass} py-8`}>{boundaryNotices}</div>
      ) : null}

      <section className={`${mapablePublicPageContainerClass} py-12 sm:py-16`}>
        <div className="grid gap-8 lg:grid-cols-2">
          <ProblemSolutionPanel
            title={problem.heading ?? "The problem"}
            items={problem.items}
            tone="default"
          />
          <ProblemSolutionPanel
            title={solution.heading ?? "How MapAble helps"}
            items={solution.items}
            tone="highlight"
          />
        </div>
      </section>

      {features ? (
        <section className="border-t border-slate-200 bg-slate-50">
          <div className={`${mapablePublicPageContainerClass} py-12 sm:py-16`}>
            <p className={mapablePublicSectionTitleClass}>Core modules</p>
            <h2 className="mapable-display mt-2 text-2xl font-black tracking-[-0.04em] text-[#0C1833] sm:text-3xl">
              {features.heading ?? "What you can expect"}
            </h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
              {features.items.map((item) => (
                <li key={item.title} className={`${mapablePublicCardClass} list-none`}>
                  <h3 className="text-base font-black text-[#0C1833]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {extraSections}

      {journey ? (
        <section className={`${mapablePublicPageContainerClass} py-12 sm:py-16`}>
          <p className={mapablePublicSectionTitleClass}>Example journey</p>
          <h2 className="mapable-display mt-2 text-xl font-black tracking-[-0.04em] text-[#0C1833] sm:text-2xl">
            {journey.heading ?? "How it works in practice"}
          </h2>
          <blockquote className="mt-6 rounded-[1.5rem] border-l-4 border-[#005B7F] bg-[#F6FBFC] p-6 text-base leading-8 text-slate-700">
            {journey.body}
          </blockquote>
        </section>
      ) : null}

      {trustSection ? (
        <section className="border-t border-slate-200 bg-slate-50">
          <div className={`${mapablePublicPageContainerClass} py-12 sm:py-16`}>
            {trustSection}
          </div>
        </section>
      ) : null}

      {interestForm ? (
        <section id="interest" className={`${mapablePublicPageContainerClass} py-12 sm:py-16`}>
          <p className={mapablePublicSectionTitleClass}>Get involved</p>
          <h2 className="mapable-display mt-2 text-2xl font-black tracking-[-0.04em] text-[#0C1833]">
            Register your interest
          </h2>
          <div className="mt-8 max-w-2xl">{interestForm}</div>
        </section>
      ) : null}

      {ecosystemLinks}
    </div>
  );
}

function ProblemSolutionPanel({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "default" | "highlight";
}) {
  const panelClass =
    tone === "highlight"
      ? "rounded-[1.5rem] border border-[#005B7F]/15 bg-[#005B7F]/5 p-6"
      : mapablePublicMutedCardClass;

  return (
    <article className={panelClass}>
      <h2 className="text-lg font-black text-[#0C1833]">{title}</h2>
      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
            <span
              className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#005B7F]"
              aria-hidden="true"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
