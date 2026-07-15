import Link from "next/link";

import { AccessLensDemoPanel } from "@/components/access-lens/AccessLensDemoPanel";
import { ACCESS_LENS_DISCLAIMER } from "@/lib/access-lens/access-lens-copy";
import { getPlaceById } from "@/lib/access-map/access-place-service";
import {
  mapablePublicEyebrowClass,
  mapablePublicLeadClass,
  mapablePublicPageContainerClass,
  mapablePublicPrimaryButtonClass,
  mapablePublicSecondaryButtonClass,
  mapablePublicTitleClass,
} from "@/lib/marketing/public-page-styles";

type PlaceAccessLensPageProps = {
  params: Promise<{ placeId: string }>;
};

export async function generateMetadata({ params }: PlaceAccessLensPageProps) {
  const { placeId } = await params;
  try {
    const place = await getPlaceById(placeId, true);
    if (!place) {
      return { title: "Access Lens | MapAble" };
    }
    return {
      title: `${place.name} Access Lens | MapAble`,
      description: `Practical Access Lens notes for ${place.name}. Camera-assisted demo and list view — not a guarantee of access or legal compliance.`,
    };
  } catch {
    return { title: "Access Lens | MapAble" };
  }
}

export default async function PlaceAccessLensPage({
  params,
}: PlaceAccessLensPageProps) {
  const { placeId } = await params;

  let placeName = "This place";
  let placeFound = false;

  try {
    const place = await getPlaceById(placeId, true);
    if (place) {
      placeFound = true;
      placeName = place.name;
    }
  } catch {
    placeFound = false;
  }

  if (!placeFound) {
    return (
      <div className={`${mapablePublicPageContainerClass} py-12`}>
        <h1 className={mapablePublicTitleClass}>Place not found</h1>
        <p className="mt-4 text-base text-slate-600">
          We could not load Access Lens details for this place.
        </p>
        <Link href="/access" className={`${mapablePublicPrimaryButtonClass} mt-6 min-h-11`}>
          Back to accessible places
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white text-[#0C1833]">
      <section
        className="border-b border-slate-200 bg-[#F6FBFC]"
        aria-labelledby="place-access-lens-heading"
      >
        <div className={`${mapablePublicPageContainerClass} py-12 sm:py-16`}>
          <a
            href="#access-lens-information"
            className="sr-only focus:not-sr-only focus:absolute focus:z-20 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-2xl focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-[#005B7F] focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
          >
            Skip Lens demo and read access information
          </a>
          <p className={mapablePublicEyebrowClass}>Place · Access Lens</p>
          <h1
            id="place-access-lens-heading"
            className={`${mapablePublicTitleClass} mt-3`}
          >
            {placeName} Access Lens
          </h1>
          <p className={mapablePublicLeadClass}>
            Preview example access cues for {placeName} in a mock camera view, or read the
            same information as a list. Conditions can change — check with the venue before
            travelling.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/access/places/${placeId}`}
              className={`${mapablePublicPrimaryButtonClass} min-h-11`}
            >
              Back to place profile
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
          placeName={placeName}
          heading={`${placeName} Lens preview`}
          description="Demo overlays and list notes for this place. These examples illustrate Access Lens and may not reflect live verified conditions."
        />
        <p className="max-w-3xl text-sm leading-6 text-slate-700" role="note">
          {ACCESS_LENS_DISCLAIMER}
        </p>
      </div>
    </div>
  );
}
