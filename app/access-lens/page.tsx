import { AccessLensDisclaimer } from "@/components/access-lens/AccessLensDisclaimer";
import { AccessLensHero } from "@/components/access-lens/AccessLensHero";
import { AccessLensPrivacyPanel } from "@/components/access-lens/AccessLensPrivacyPanel";
import { AccessLensSyntheticDemo } from "@/components/access-lens/AccessLensSyntheticDemo";
import {
  visionAccessBuiltForA11yCopy,
  visionAccessHowItWorksSteps,
} from "@/lib/vision-access";
import {
  mapablePublicCardClass,
  mapablePublicPageContainerClass,
  mapablePublicSectionTitleClass,
} from "@/lib/marketing/public-page-styles";

export const metadata = {
  title: "MapAble Access Lens | Provisional access candidates",
  description:
    "Synthetic Access Lens demo for entrances, barriers and doorway candidates. Practical guidance only — not a guarantee of access, navigation, or legal compliance.",
};

export default function AccessLensPage() {
  return (
    <div className="bg-white text-mapable-navy">
      <AccessLensHero />

      <div
        className={`${mapablePublicPageContainerClass} space-y-16 py-12 sm:space-y-20 sm:py-16`}
      >
        <section aria-labelledby="how-access-lens-works-heading" id="how-it-works">
          <p className={mapablePublicSectionTitleClass}>Overview</p>
          <h2
            id="how-access-lens-works-heading"
            className="mapable-display mt-2 text-2xl font-black tracking-[-0.04em] text-mapable-navy sm:text-3xl"
          >
            How Access Lens works
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            VisionAccessOS produces provisional candidates. Participants confirm. Deterministic
            MapAble services classify evidence. Verified claims require human evidence.
          </p>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2">
            {visionAccessHowItWorksSteps.map((step, index) => (
              <li key={step.title} className={mapablePublicCardClass}>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-mapable-brand">
                  Step {index + 1}
                </p>
                <h3 className="mt-2 text-lg font-black text-mapable-navy">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <AccessLensSyntheticDemo />

        <section
          aria-labelledby="access-lens-a11y-heading"
          id="accessibility"
          className="scroll-mt-24"
        >
          <p className={mapablePublicSectionTitleClass}>Accessibility</p>
          <h2
            id="access-lens-a11y-heading"
            className="mapable-display mt-2 text-2xl font-black tracking-[-0.04em] text-mapable-navy sm:text-3xl"
          >
            {visionAccessBuiltForA11yCopy.title}
          </h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            {visionAccessBuiltForA11yCopy.body}
          </p>
          <ul className={`mt-6 space-y-2 ${mapablePublicCardClass}`}>
            {visionAccessBuiltForA11yCopy.points.map((point) => (
              <li key={point} className="text-sm leading-6 text-slate-700">
                {point}
              </li>
            ))}
          </ul>
        </section>

        <AccessLensPrivacyPanel />

        <AccessLensDisclaimer />
      </div>
    </div>
  );
}
