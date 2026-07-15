import Link from "next/link";
import { notFound } from "next/navigation";

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
import {
  accessGuides,
  getAccessGuideBySlug,
} from "@/lib/resources/access-guides-data";

type GuideAccessLensPageProps = {
  params: Promise<{ state: string; city: string }>;
};

export function generateStaticParams() {
  return accessGuides.map((guide) => ({
    state: guide.stateSlug,
    city: guide.citySlug,
  }));
}

export async function generateMetadata({ params }: GuideAccessLensPageProps) {
  const { state, city } = await params;
  const guide = getAccessGuideBySlug(state, city);
  if (!guide) {
    return { title: "Access Lens | MapAble" };
  }
  return {
    title: `${guide.city} Access Lens | MapAble`,
    description: `Camera-assisted and list-based access planning support for ${guide.city}. Practical information only — not a guarantee of access.`,
  };
}

export default async function GuideAccessLensPage({
  params,
}: GuideAccessLensPageProps) {
  const { state, city } = await params;
  const guide = getAccessGuideBySlug(state, city);
  if (!guide) {
    notFound();
  }

  return (
    <div className="bg-white text-[#0C1833]">
      <section
        className="border-b border-slate-200 bg-[#F6FBFC]"
        aria-labelledby="guide-access-lens-heading"
      >
        <div className={`${mapablePublicPageContainerClass} py-12 sm:py-16`}>
          <a
            href="#access-lens-information"
            className="sr-only focus:not-sr-only focus:absolute focus:z-20 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-2xl focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-[#005B7F] focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
          >
            Skip Lens demo and read access information
          </a>
          <p className={mapablePublicEyebrowClass}>
            {guide.state} · {guide.city} · Access Lens
          </p>
          <h1
            id="guide-access-lens-heading"
            className={`${mapablePublicTitleClass} mt-3`}
          >
            {guide.city} Access Lens
          </h1>
          <p className={mapablePublicLeadClass}>
            Use Access Lens with the {guide.city} Accessibility Guide to preview access
            cues in a mock camera view and read the same details as a list. This is
            practical planning support, not a guarantee of access on the day.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={guide.href} className={`${mapablePublicPrimaryButtonClass} min-h-11`}>
              Back to {guide.city} guide
            </Link>
            <Link
              href="/access-lens"
              className={`${mapablePublicSecondaryButtonClass} min-h-11`}
            >
              About Access Lens
            </Link>
          </div>
        </div>
      </section>

      <div className={`${mapablePublicPageContainerClass} space-y-10 py-12 sm:py-16`}>
        <AccessLensDemoPanel
          placeName={guide.city}
          heading={`${guide.city} Lens preview`}
          description="Example overlays and list notes for city access planning. Confirm opening hours, bookings and on-the-ground conditions before travelling."
        />
        <p className="max-w-3xl text-sm leading-6 text-slate-700" role="note">
          {ACCESS_LENS_DISCLAIMER}
        </p>
      </div>
    </div>
  );
}
