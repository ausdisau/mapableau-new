import Link from "next/link";
import type { ReactNode } from "react";

import {
  mapablePublicCardClass,
  mapablePublicEyebrowClass,
  mapablePublicLeadClass,
  mapablePublicPageContainerClass,
  mapablePublicPrimaryButtonClass,
  mapablePublicSectionTitleClass,
  mapablePublicTitleClass,
} from "@/lib/marketing/public-page-styles";

export type PublicInfoSection = {
  title: string;
  content: ReactNode;
};

export function PublicInfoPage({
  eyebrow,
  title,
  description,
  sections,
  ctaLabel = "Contact MapAble",
  ctaHref = "/contact",
}: {
  eyebrow: string;
  title: string;
  description: string;
  sections: PublicInfoSection[];
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="bg-white text-[#0C1833]">
      <section className="relative overflow-hidden border-b border-slate-200 bg-[#F7F8FC]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-6rem] top-[-6rem] h-64 w-64 rounded-full bg-[#F26A21]/25 blur-3xl"
        />
        <div className={`${mapablePublicPageContainerClass} relative py-14 sm:py-20`}>
          <div className="max-w-3xl">
            <p className={mapablePublicEyebrowClass}>{eyebrow}</p>
            <h1 className={`${mapablePublicTitleClass} mt-3`}>{title}</h1>
            <p className={mapablePublicLeadClass}>{description}</p>
            <Link href={ctaHref} className={`${mapablePublicPrimaryButtonClass} mt-8`}>
              {ctaLabel}
            </Link>
          </div>
        </div>
      </section>

      <section className={`${mapablePublicPageContainerClass} py-12 sm:py-16`}>
        <div className="mb-8 max-w-2xl">
          <p className={mapablePublicSectionTitleClass}>Details</p>
          <p className="mt-2 text-base leading-7 text-slate-600">
            Clear information, without overstated claims.
          </p>
        </div>

        <div className="grid gap-5">
          {sections.map((section, index) => (
            <article
              key={section.title}
              className={`${mapablePublicCardClass} ${
                index === 0 ? "border-[#3B5BDB]/15 bg-[#F7F8FC]" : ""
              }`}
            >
              <h2 className="text-lg font-black text-[#0C1833]">{section.title}</h2>
              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                {section.content}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/help" className={mapablePublicPrimaryButtonClass}>
            Visit help centre
          </Link>
          <Link
            href="/privacy"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-bold text-[#3B5BDB] transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-[#F26A21]/40"
          >
            Privacy policy
          </Link>
        </div>
      </section>
    </div>
  );
}
