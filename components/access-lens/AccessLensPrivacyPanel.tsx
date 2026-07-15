import {
  accessLensPrivacyBullets,
  accessLensPrivacyIntro,
} from "@/lib/access-lens/access-lens-copy";
import {
  mapablePublicMutedCardClass,
  mapablePublicSectionTitleClass,
} from "@/lib/marketing/public-page-styles";

type AccessLensPrivacyPanelProps = {
  id?: string;
};

export function AccessLensPrivacyPanel({
  id = "access-lens-privacy",
}: AccessLensPrivacyPanelProps) {
  const headingId = `${id}-heading`;

  return (
    <section aria-labelledby={headingId} id={id} className="scroll-mt-24">
      <p className={mapablePublicSectionTitleClass}>Privacy</p>
      <h2
        id={headingId}
        className="mapable-display mt-2 text-2xl font-black tracking-[-0.04em] text-[#0C1833] sm:text-3xl"
      >
        Privacy and consent
      </h2>
      <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
        {accessLensPrivacyIntro}
      </p>
      <div className={`${mapablePublicMutedCardClass} mt-8`}>
        <ul className="space-y-3">
          {accessLensPrivacyBullets.map((bullet) => (
            <li key={bullet} className="flex gap-3 text-sm leading-6 text-slate-700">
              <span
                className="mt-2 inline-block h-2 w-2 shrink-0 rounded-full bg-[#005B7F]"
                aria-hidden="true"
              />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
