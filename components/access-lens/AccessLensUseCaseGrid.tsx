import { accessLensUseCases } from "@/lib/access-lens/access-lens-copy";
import {
  mapablePublicCardClass,
  mapablePublicSectionTitleClass,
} from "@/lib/marketing/public-page-styles";

type AccessLensUseCaseGridProps = {
  id?: string;
  title?: string;
  description?: string;
};

export function AccessLensUseCaseGrid({
  id = "access-lens-use-cases",
  title = "Practical ways to use Access Lens",
  description = "Each use case focuses on one planning task — from arriving step-free to finding a quieter place to rest.",
}: AccessLensUseCaseGridProps) {
  const headingId = `${id}-heading`;

  return (
    <section aria-labelledby={headingId} id={id} className="scroll-mt-24">
      <p className={mapablePublicSectionTitleClass}>Use cases</p>
      <h2
        id={headingId}
        className="mapable-display mt-2 text-2xl font-black tracking-[-0.04em] text-[#0C1833] sm:text-3xl"
      >
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">{description}</p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accessLensUseCases.map((useCase) => (
          <li key={useCase.id} className={mapablePublicCardClass}>
            <h3 className="text-lg font-black text-[#0C1833]">{useCase.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{useCase.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
