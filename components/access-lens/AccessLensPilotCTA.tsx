import Link from "next/link";

import {
  accessLensPilotCtaCopy,
  accessLensPilotRoadmap,
} from "@/lib/access-lens/access-lens-copy";
import {
  mapablePublicCardClass,
  mapablePublicPrimaryButtonClass,
  mapablePublicSectionTitleClass,
} from "@/lib/marketing/public-page-styles";

type AccessLensPilotCTAProps = {
  id?: string;
  showRoadmap?: boolean;
};

export function AccessLensPilotCTA({
  id = "access-lens-pilot",
  showRoadmap = true,
}: AccessLensPilotCTAProps) {
  const headingId = `${id}-heading`;
  const roadmapHeadingId = `${id}-roadmap-heading`;

  return (
    <section aria-labelledby={headingId} id={id} className="scroll-mt-24">
      {showRoadmap ? (
        <div className="mb-12" id="pilot-roadmap" aria-labelledby={roadmapHeadingId}>
          <p className={mapablePublicSectionTitleClass}>Roadmap</p>
          <h2
            id={roadmapHeadingId}
            className="mapable-display mt-2 text-2xl font-black tracking-[-0.04em] text-[#0C1833] sm:text-3xl"
          >
            Pilot roadmap
          </h2>
          <ol className="mt-8 grid gap-4 lg:grid-cols-3">
            {accessLensPilotRoadmap.map((item) => (
              <li key={item.phase} className={mapablePublicCardClass}>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#005B7F]">
                  {item.phase}
                </p>
                <h3 className="mt-2 text-lg font-black text-[#0C1833]">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <div className="rounded-[1.7rem] border border-[#005B7F]/15 bg-[#F8C51C]/15 p-6 sm:p-8">
        <p className={mapablePublicSectionTitleClass}>Pilot</p>
        <h2
          id={headingId}
          className="mapable-display mt-2 text-2xl font-black tracking-[-0.04em] text-[#0C1833] sm:text-3xl"
        >
          {accessLensPilotCtaCopy.title}
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-700">
          {accessLensPilotCtaCopy.body}
        </p>
        <Link
          href={accessLensPilotCtaCopy.ctaHref}
          className={`${mapablePublicPrimaryButtonClass} mt-6 min-h-11`}
        >
          {accessLensPilotCtaCopy.ctaLabel}
        </Link>
        <p className="mt-6 max-w-3xl text-sm leading-6 text-slate-700" role="note">
          {accessLensPilotCtaCopy.disclaimer}
        </p>
      </div>
    </section>
  );
}
