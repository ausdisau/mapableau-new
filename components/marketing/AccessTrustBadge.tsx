import { Award } from "lucide-react";

export type AccessTrustBadgeProps = {
  venueName: string;
  tier: "Bronze" | "Silver" | "Gold";
  score: number;
  assessmentDate: string;
  nextReviewDate: string;
  detailsHref?: string;
};

const tierLabels: Record<AccessTrustBadgeProps["tier"], string> = {
  Bronze: "Bronze — basic access information verified",
  Silver: "Silver — detailed access assessment",
  Gold: "Gold — comprehensive access assessment",
};

export function AccessTrustBadge({
  venueName,
  tier,
  score,
  assessmentDate,
  nextReviewDate,
  detailsHref = "#",
}: AccessTrustBadgeProps) {
  return (
    <figure
      className="rounded-[1.5rem] border-2 border-[#005B7F]/20 bg-white p-6 shadow-sm"
      aria-labelledby="trust-badge-title"
    >
      <div className="flex items-start gap-4">
        <span
          className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F8C51C]/25 text-[#005B7F]"
          aria-hidden="true"
        >
          <Award className="h-7 w-7" />
        </span>
        <figcaption className="flex-1">
          <p className="text-xs font-black uppercase tracking-wide text-[#005B7F]">
            MapAble Verified
          </p>
          <h3 id="trust-badge-title" className="mt-1 text-lg font-black text-[#0C1833]">
            {venueName}
          </h3>
          <dl className="mt-3 space-y-2 text-sm text-slate-700">
            <div className="flex flex-wrap gap-x-2">
              <dt className="font-bold">Tier:</dt>
              <dd>{tierLabels[tier]}</dd>
            </div>
            <div className="flex flex-wrap gap-x-2">
              <dt className="font-bold">Score:</dt>
              <dd>{score} out of 100</dd>
            </div>
            <div className="flex flex-wrap gap-x-2">
              <dt className="font-bold">Assessed:</dt>
              <dd>{assessmentDate}</dd>
            </div>
            <div className="flex flex-wrap gap-x-2">
              <dt className="font-bold">Next review:</dt>
              <dd>{nextReviewDate}</dd>
            </div>
          </dl>
          <a
            href={detailsHref}
            className="mt-4 inline-flex text-sm font-bold text-[#005B7F] underline focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
          >
            View full accessibility details
          </a>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            MapAble verification reflects assessment against MapAble criteria. It is not
            legal certification or a guarantee of compliance with building standards or
            discrimination law.
          </p>
        </figcaption>
      </div>
    </figure>
  );
}
