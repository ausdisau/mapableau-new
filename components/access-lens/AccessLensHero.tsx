import Link from "next/link";
import React from "react";

import {
  mapablePublicLeadClass,
  mapablePublicPageContainerClass,
  mapablePublicPrimaryButtonClass,
  mapablePublicSecondaryButtonClass,
  mapablePublicTitleClass,
} from "@/lib/marketing/public-page-styles";
import {
  visionAccessHeroCopy,
  VISION_ACCESS_SYNTHETIC_BANNER,
} from "@/lib/vision-access";

export function AccessLensHero() {
  return (
    <header className="border-b border-slate-200 bg-gradient-to-b from-mapable-surface to-white">
      <div className={`${mapablePublicPageContainerClass} py-12 sm:py-16`}>
        <p className="text-sm font-black uppercase tracking-[0.16em] text-mapable-brand">
          VisionAccessOS
        </p>
        <h1 className={`${mapablePublicTitleClass} mt-3`}>
          {visionAccessHeroCopy.heading}
        </h1>
        <p className={mapablePublicLeadClass}>{visionAccessHeroCopy.subheading}</p>
        <p
          className="mt-4 max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950"
          role="status"
        >
          {VISION_ACCESS_SYNTHETIC_BANNER}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={visionAccessHeroCopy.primaryCta.href}
            className={mapablePublicPrimaryButtonClass}
          >
            {visionAccessHeroCopy.primaryCta.label}
          </Link>
          <Link
            href={visionAccessHeroCopy.secondaryCta.href}
            className={mapablePublicSecondaryButtonClass}
          >
            {visionAccessHeroCopy.secondaryCta.label}
          </Link>
          <a
            href="#access-lens-disclaimer"
            className="inline-flex min-h-11 items-center text-sm font-bold text-mapable-navy underline-offset-4 hover:underline"
          >
            {visionAccessHeroCopy.skipDemoLabel}
          </a>
        </div>
        <p className="mt-6 max-w-2xl text-sm leading-6 text-slate-600">
          {visionAccessHeroCopy.trustNote}
        </p>
      </div>
    </header>
  );
}
