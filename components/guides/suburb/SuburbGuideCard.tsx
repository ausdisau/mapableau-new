import Link from "next/link";
import React from "react";

import { SuburbGuideStatusBadge } from "@/components/guides/suburb/SuburbGuideStatusBadge";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import { mapablePublicCardClass } from "@/lib/marketing/public-page-styles";
import type { SuburbAccessGuide } from "@/types/suburb-access-guide";

type SuburbGuideCardProps = {
  guide: SuburbAccessGuide;
};

export function SuburbGuideCard({ guide }: SuburbGuideCardProps) {
  return (
    <Link
      href={guide.href}
      className={`${mapablePublicCardClass} block transition hover:border-[#005B7F]/30 hover:shadow-sm motion-reduce:transform-none ${mapableCareFocusRing}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#005B7F]">
          {guide.state} · SAL {guide.salCode}
        </p>
        <SuburbGuideStatusBadge status={guide.guideStatus} />
      </div>
      <h3 className="mt-3 text-lg font-black text-[#0C1833]">{guide.name}</h3>
      <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-700">
        {guide.accessSummary}
      </p>
      <p className="mt-4 text-xs font-semibold text-slate-500">
        Confidence {guide.confidenceScore} · Updated {guide.lastUpdated}
      </p>
    </Link>
  );
}
