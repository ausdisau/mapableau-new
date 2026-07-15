import Link from "next/link";

import { accessLensHeroCopy } from "@/lib/access-lens/access-lens-copy";
import {
  mapablePublicEyebrowClass,
  mapablePublicLeadClass,
  mapablePublicPageContainerClass,
  mapablePublicPrimaryButtonClass,
  mapablePublicSecondaryButtonClass,
  mapablePublicTitleClass,
} from "@/lib/marketing/public-page-styles";

type AccessLensHeroProps = {
  skipHref?: string;
  primaryCtaHref?: string;
  secondaryCtaHref?: string;
};

export function AccessLensHero({
  skipHref = "#access-lens-information",
  primaryCtaHref = accessLensHeroCopy.primaryCta.href,
  secondaryCtaHref = accessLensHeroCopy.secondaryCta.href,
}: AccessLensHeroProps) {
  return (
    <section
      className="relative overflow-hidden border-b border-slate-200 bg-[#F6FBFC]"
      aria-labelledby="access-lens-heading"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-6rem] top-[-6rem] h-64 w-64 rounded-full bg-[#F8C51C]/25 blur-3xl motion-reduce:blur-none"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-8rem] left-[-6rem] h-72 w-72 rounded-full bg-[#00A979]/10 blur-3xl motion-reduce:blur-none"
      />
      <div className={`${mapablePublicPageContainerClass} relative py-14 sm:py-20`}>
        <a
          href={skipHref}
          className="sr-only focus:not-sr-only focus:absolute focus:left-5 focus:top-5 focus:z-20 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-2xl focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-[#005B7F] focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
        >
          {accessLensHeroCopy.skipDemoLabel}
        </a>
        <div className="max-w-3xl">
          <p className={mapablePublicEyebrowClass}>Access Lens</p>
          <h1 id="access-lens-heading" className={`${mapablePublicTitleClass} mt-3`}>
            {accessLensHeroCopy.heading}
          </h1>
          <p className={mapablePublicLeadClass}>{accessLensHeroCopy.subheading}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={primaryCtaHref}
              className={`${mapablePublicPrimaryButtonClass} min-h-11`}
            >
              {accessLensHeroCopy.primaryCta.label}
            </Link>
            <Link
              href={secondaryCtaHref}
              className={`${mapablePublicSecondaryButtonClass} min-h-11`}
            >
              {accessLensHeroCopy.secondaryCta.label}
            </Link>
          </div>
          <p
            className="mt-6 max-w-2xl rounded-2xl border border-[#005B7F]/20 bg-white/80 px-4 py-3 text-sm leading-6 text-slate-700"
            role="note"
          >
            {accessLensHeroCopy.trustNote}
          </p>
        </div>
      </div>
    </section>
  );
}
