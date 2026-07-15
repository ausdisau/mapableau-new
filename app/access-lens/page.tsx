import { AccessLensDemoPanel } from "@/components/access-lens/AccessLensDemoPanel";
import { AccessLensHero } from "@/components/access-lens/AccessLensHero";
import { AccessLensModeCards } from "@/components/access-lens/AccessLensModeCards";
import { AccessLensPilotCTA } from "@/components/access-lens/AccessLensPilotCTA";
import { AccessLensPrivacyPanel } from "@/components/access-lens/AccessLensPrivacyPanel";
import { AccessLensUseCaseGrid } from "@/components/access-lens/AccessLensUseCaseGrid";
import { AccessLensVerificationLabels } from "@/components/access-lens/AccessLensVerificationLabels";
import {
  accessLensBuiltForA11yCopy,
  accessLensHowItWorksSteps,
  accessLensSensoryCopy,
  accessLensTransportCopy,
} from "@/lib/access-lens/access-lens-copy";
import {
  mapablePublicCardClass,
  mapablePublicPageContainerClass,
  mapablePublicSectionTitleClass,
} from "@/lib/marketing/public-page-styles";

export const metadata = {
  title: "MapAble Access Lens | Practical access information",
  description:
    "Camera-assisted and list-based access information for entrances, ramps, toilets, quiet spaces and drop-off points. Practical guidance only — not a guarantee of access or legal compliance.",
};

export default function AccessLensPage() {
  return (
    <div className="bg-white text-[#0C1833]">
      <AccessLensHero />

      <div className={`${mapablePublicPageContainerClass} space-y-16 py-12 sm:space-y-20 sm:py-16`}>
        <section aria-labelledby="how-access-lens-works-heading" id="how-it-works">
          <p className={mapablePublicSectionTitleClass}>Overview</p>
          <h2
            id="how-access-lens-works-heading"
            className="mapable-display mt-2 text-2xl font-black tracking-[-0.04em] text-[#0C1833] sm:text-3xl"
          >
            How Access Lens works
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Access Lens combines camera-assisted cues with accessible list views so you can
            plan before you enter, travel or book.
          </p>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2">
            {accessLensHowItWorksSteps.map((step, index) => (
              <li key={step.title} className={mapablePublicCardClass}>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#005B7F]">
                  Step {index + 1}
                </p>
                <h3 className="mt-2 text-lg font-black text-[#0C1833]">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <AccessLensModeCards
          id="user-business-modes"
          title="User Lens and Business Lens"
          description="People can preview access cues before arriving. Businesses can contribute clearer venue notes through a guided self-check."
        />

        <AccessLensDemoPanel />

        <section
          aria-labelledby="transport-pickup-heading"
          id="transport-pickup"
          className="scroll-mt-24"
        >
          <p className={mapablePublicSectionTitleClass}>Arrival</p>
          <h2
            id="transport-pickup-heading"
            className="mapable-display mt-2 text-2xl font-black tracking-[-0.04em] text-[#0C1833] sm:text-3xl"
          >
            {accessLensTransportCopy.title}
          </h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            {accessLensTransportCopy.body}
          </p>
        </section>

        <section
          aria-labelledby="sensory-friendly-heading"
          id="sensory-friendly"
          className="scroll-mt-24"
        >
          <p className={mapablePublicSectionTitleClass}>Sensory</p>
          <h2
            id="sensory-friendly-heading"
            className="mapable-display mt-2 text-2xl font-black tracking-[-0.04em] text-[#0C1833] sm:text-3xl"
          >
            {accessLensSensoryCopy.title}
          </h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            {accessLensSensoryCopy.body}
          </p>
        </section>

        <AccessLensPrivacyPanel />

        <AccessLensVerificationLabels />

        <section
          aria-labelledby="built-for-accessibility-heading"
          id="built-for-accessibility"
          className="scroll-mt-24"
        >
          <p className={mapablePublicSectionTitleClass}>Accessibility</p>
          <h2
            id="built-for-accessibility-heading"
            className="mapable-display mt-2 text-2xl font-black tracking-[-0.04em] text-[#0C1833] sm:text-3xl"
          >
            {accessLensBuiltForA11yCopy.title}
          </h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            {accessLensBuiltForA11yCopy.body}
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {accessLensBuiltForA11yCopy.points.map((point) => (
              <li key={point} className={mapablePublicCardClass}>
                <p className="text-sm font-semibold leading-6 text-slate-700">{point}</p>
              </li>
            ))}
          </ul>
        </section>

        <AccessLensUseCaseGrid />

        <AccessLensPilotCTA />
      </div>
    </div>
  );
}
