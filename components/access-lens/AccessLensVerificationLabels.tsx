import { accessLensVerificationExplainers } from "@/lib/access-lens/access-lens-copy";
import {
  mapablePublicCardClass,
  mapablePublicSectionTitleClass,
} from "@/lib/marketing/public-page-styles";

type AccessLensVerificationLabelsProps = {
  id?: string;
};

export function AccessLensVerificationLabels({
  id = "access-lens-verification",
}: AccessLensVerificationLabelsProps) {
  const headingId = `${id}-heading`;

  return (
    <section aria-labelledby={headingId} id={id} className="scroll-mt-24">
      <p className={mapablePublicSectionTitleClass}>Verification</p>
      <h2
        id={headingId}
        className="mapable-display mt-2 text-2xl font-black tracking-[-0.04em] text-[#0C1833] sm:text-3xl"
      >
        Verification labels
      </h2>
      <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
        Labels show where an access note came from and how much review it has had.
        They do not mean legal compliance or guaranteed access.
      </p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accessLensVerificationExplainers.map((item) => (
          <li key={item.status} className={mapablePublicCardClass}>
            <p className="inline-flex min-h-11 items-center rounded-2xl border border-[#005B7F]/25 bg-[#005B7F]/10 px-3 text-sm font-black text-[#005B7F]">
              {item.label}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.explanation}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
