import Link from "next/link";
import React from "react";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import {
  mapablePublicCardClass,
  mapablePublicPrimaryButtonClass,
  mapablePublicSecondaryButtonClass,
} from "@/lib/marketing/public-page-styles";

type SuburbGuideReportUpdateCTAProps = {
  reportHref: string;
  guideName: string;
};

export function SuburbGuideReportUpdateCTA({
  reportHref,
  guideName,
}: SuburbGuideReportUpdateCTAProps) {
  return (
    <aside
      className={`${mapablePublicCardClass} border-[#005B7F]/20 bg-[#F6FBFC]`}
      aria-labelledby="suburb-report-heading"
    >
      <h2
        id="suburb-report-heading"
        className="text-lg font-black text-[#0C1833] sm:text-xl"
      >
        Report an update
      </h2>
      <p className="mt-3 text-sm leading-7 text-slate-700">
        Seen a better drop-off point, closed toilet or quieter route in{" "}
        {guideName}? Share an access update so MapAble can improve this
        locality guide.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={reportHref}
          className={`${mapablePublicPrimaryButtonClass} ${mapableCareFocusRing}`}
        >
          Report an update
        </Link>
        <Link
          href="/contact?topic=accessibility"
          className={`${mapablePublicSecondaryButtonClass} ${mapableCareFocusRing}`}
        >
          Contact MapAble
        </Link>
      </div>
    </aside>
  );
}
