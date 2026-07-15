import Link from "next/link";

import { AccessLensModeCards } from "@/components/access-lens/AccessLensModeCards";
import { AccessLensPilotCTA } from "@/components/access-lens/AccessLensPilotCTA";
import { AccessLensPrivacyPanel } from "@/components/access-lens/AccessLensPrivacyPanel";
import { AccessLensVerificationLabels } from "@/components/access-lens/AccessLensVerificationLabels";
import {
  accessLensBusinessChecklistHints,
  accessLensBusinessSelfCheckIntro,
  accessLensModeCards,
} from "@/lib/access-lens/access-lens-copy";
import {
  mapablePublicCardClass,
  mapablePublicEyebrowClass,
  mapablePublicLeadClass,
  mapablePublicPageContainerClass,
  mapablePublicPrimaryButtonClass,
  mapablePublicSecondaryButtonClass,
  mapablePublicSectionTitleClass,
  mapablePublicTitleClass,
} from "@/lib/marketing/public-page-styles";
import {
  ACCESS_LENS_DISCLAIMER,
  ACCESS_LENS_OBSERVATION_TYPE_LABELS,
  type AccessLensObservationType,
} from "@/types/accessLens";

export const metadata = {
  title: "Access Lens self-check for businesses | MapAble",
  description:
    "A practical Access Lens checklist for venues to note entrances, ramps, toilets, quiet spaces and drop-off points. Not a compliance audit.",
};

const observationTypes = Object.keys(
  ACCESS_LENS_OBSERVATION_TYPE_LABELS
) as AccessLensObservationType[];

export default function AccessLensSelfCheckPage() {
  const businessCards = accessLensModeCards.filter((card) => card.mode === "business");

  return (
    <div className="bg-white text-[#0C1833]">
      <section
        className="border-b border-slate-200 bg-[#F6FBFC]"
        aria-labelledby="access-lens-self-check-heading"
      >
        <div className={`${mapablePublicPageContainerClass} py-12 sm:py-16`}>
          <p className={mapablePublicEyebrowClass}>
            {accessLensBusinessSelfCheckIntro.eyebrow}
          </p>
          <h1
            id="access-lens-self-check-heading"
            className={`${mapablePublicTitleClass} mt-3`}
          >
            {accessLensBusinessSelfCheckIntro.title}
          </h1>
          <p className={mapablePublicLeadClass}>
            {accessLensBusinessSelfCheckIntro.description}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/access-lens/demo" className={`${mapablePublicPrimaryButtonClass} min-h-11`}>
              Try the Lens demo
            </Link>
            <Link href="/access-lens" className={`${mapablePublicSecondaryButtonClass} min-h-11`}>
              About Access Lens
            </Link>
          </div>
          <p className="mt-6 max-w-2xl text-sm leading-6 text-slate-700" role="note">
            {ACCESS_LENS_DISCLAIMER}
          </p>
        </div>
      </section>

      <div className={`${mapablePublicPageContainerClass} space-y-16 py-12 sm:py-16`}>
        <section aria-labelledby="self-check-list-heading" id="self-check-list">
          <p className={mapablePublicSectionTitleClass}>Checklist</p>
          <h2
            id="self-check-list-heading"
            className="mapable-display mt-2 text-2xl font-black tracking-[-0.04em] text-[#0C1833] sm:text-3xl"
          >
            What to note for visitors
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Work through these observation types in plain language. Share only information
            you can keep reasonably current. This self-check is not a building, legal or
            NDIS compliance assessment.
          </p>
          <ul className="mt-8 space-y-3">
            {observationTypes.map((type) => (
              <li key={type} className={`${mapablePublicCardClass} flex gap-4`}>
                <span
                  className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 border-[#005B7F] text-[#005B7F]"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-base font-black text-[#0C1833]">
                    {ACCESS_LENS_OBSERVATION_TYPE_LABELS[type]}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {accessLensBusinessChecklistHints[type]}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <AccessLensModeCards
          title="Business Lens"
          description="Use Business Lens to contribute access notes visitors can read as text or preview in the demo."
          cards={businessCards.length > 0 ? businessCards : accessLensModeCards}
        />

        <AccessLensPrivacyPanel />
        <AccessLensVerificationLabels />
        <AccessLensPilotCTA showRoadmap={false} />
      </div>
    </div>
  );
}
