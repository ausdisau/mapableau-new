import Link from "next/link";

import { AccessLensDemoPanel } from "@/components/access-lens/AccessLensDemoPanel";
import { ACCESS_LENS_DISCLAIMER } from "@/lib/access-lens/access-lens-copy";
import {
  mapablePublicEyebrowClass,
  mapablePublicLeadClass,
  mapablePublicPageContainerClass,
  mapablePublicPrimaryButtonClass,
  mapablePublicSecondaryButtonClass,
  mapablePublicTitleClass,
} from "@/lib/marketing/public-page-styles";

export const metadata = {
  title: "Access Lens demo | MapAble",
  description:
    "Try the MapAble Access Lens mock camera demo and matching accessible list of entrances, toilets, quiet spaces and route notes. Practical information only.",
};

export default function AccessLensDemoPage() {
  return (
    <div className="bg-white text-[#0C1833]">
      <section
        className="border-b border-slate-200 bg-[#F6FBFC]"
        aria-labelledby="access-lens-demo-page-heading"
      >
        <div className={`${mapablePublicPageContainerClass} py-12 sm:py-16`}>
          <a
            href="#access-lens-information"
            className="sr-only focus:not-sr-only focus:absolute focus:z-20 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-2xl focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-[#005B7F] focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
          >
            Skip Lens demo and read access information
          </a>
          <p className={mapablePublicEyebrowClass}>Access Lens demo</p>
          <h1
            id="access-lens-demo-page-heading"
            className={`${mapablePublicTitleClass} mt-3`}
          >
            Try the Lens demo
          </h1>
          <p className={mapablePublicLeadClass}>
            Explore a mock phone camera with high-contrast access overlays, and read the same
            notes in the list view. No real camera or photo upload is required for this demo.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/access-lens" className={`${mapablePublicSecondaryButtonClass} min-h-11`}>
              Back to Access Lens
            </Link>
            <Link
              href="/resources/business/access-lens-self-check"
              className={`${mapablePublicPrimaryButtonClass} min-h-11`}
            >
              Start a business self-check
            </Link>
          </div>
        </div>
      </section>

      <div className={`${mapablePublicPageContainerClass} space-y-10 py-12 sm:py-16`}>
        <AccessLensDemoPanel
          heading="Camera-assisted preview"
          description="Overlay examples show practical cues such as accessible entrances, step-free routes, toilets and quiet areas. Always use the list view if you prefer text."
        />
        <p className="max-w-3xl text-sm leading-6 text-slate-700" role="note">
          {ACCESS_LENS_DISCLAIMER}
        </p>
      </div>
    </div>
  );
}
