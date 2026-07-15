import Link from "next/link";
import React from "react";

import { BusinessDisclaimerPanel } from "@/components/resources/business/BusinessDisclaimerPanel";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import {
  mapablePublicEyebrowClass,
  mapablePublicLeadClass,
  mapablePublicPageContainerClass,
  mapablePublicPrimaryButtonClass,
  mapablePublicTitleClass,
} from "@/lib/marketing/public-page-styles";
import {
  formatBusinessAudience,
  formatBusinessBarrier,
  formatBusinessFormat,
} from "@/lib/resources/business-resources-data";
import type { BusinessResource } from "@/types/business-resource";

type BusinessResourcePageContentProps = {
  resource: BusinessResource;
  children?: React.ReactNode;
};

export function BusinessResourcePageContent({
  resource,
  children,
}: BusinessResourcePageContentProps) {
  return (
    <main className="bg-white text-[#0C1833]">
      <header className="border-b border-slate-200 bg-[#F6FBFC]">
        <div className={`${mapablePublicPageContainerClass} py-14 sm:py-20`}>
          <p className={mapablePublicEyebrowClass}>
            Business Access Resources · {formatBusinessFormat(resource.format)}
          </p>
          <h1 className={`${mapablePublicTitleClass} mt-3`}>{resource.title}</h1>
          <p className={mapablePublicLeadClass}>{resource.summary}</p>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Audience:{" "}
            {resource.audience
              .map((item) => formatBusinessAudience(item))
              .join(", ")}
            . Barrier focus:{" "}
            {resource.barrierTypes
              .map((item) => formatBusinessBarrier(item))
              .join(", ")}
            .
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/resources/business"
              className={`${mapablePublicPrimaryButtonClass} ${mapableCareFocusRing}`}
            >
              All business resources
            </Link>
            <Link
              href="/resources"
              className={`inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-bold text-[#005B7F] ${mapableCareFocusRing}`}
            >
              Resource hub
            </Link>
          </div>
        </div>
      </header>

      <div
        className={`${mapablePublicPageContainerClass} space-y-8 py-12 sm:py-16`}
      >
        {children}

        {resource.sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            aria-labelledby={`${section.id}-heading`}
            className="space-y-3"
          >
            <h2
              id={`${section.id}-heading`}
              className="text-lg font-black text-[#0C1833] sm:text-xl"
            >
              {section.title}
            </h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-sm leading-7 text-slate-700">
                {paragraph}
              </p>
            ))}
            {section.bullets && section.bullets.length > 0 ? (
              <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}

        <BusinessDisclaimerPanel />
      </div>
    </main>
  );
}
