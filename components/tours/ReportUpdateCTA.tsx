import Link from "next/link";
import React from "react";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import {
  mapablePublicCardClass,
  mapablePublicPrimaryButtonClass,
  mapablePublicSecondaryButtonClass,
} from "@/lib/marketing/public-page-styles";

type ReportUpdateCTAProps = {
  title?: string;
  description?: string;
  suggestLabel?: string;
  reportLabel?: string;
  tourSlug?: string;
};

export function ReportUpdateCTA({
  title = "Suggest a tour / Report an access update",
  description = "Seen a quieter route, a closed toilet, or a better drop-off point? Share an update so MapAble can improve this planning resource.",
  suggestLabel = "Suggest a tour",
  reportLabel = "Report an access update",
  tourSlug,
}: ReportUpdateCTAProps) {
  const subject = tourSlug
    ? encodeURIComponent(`Tour update: ${tourSlug}`)
    : encodeURIComponent("MapAble tour suggestion or access update");
  const contactHref = `/contact?topic=accessibility&subject=${subject}`;

  return (
    <aside
      className={`${mapablePublicCardClass} border-[#005B7F]/20 bg-[#F6FBFC]`}
      aria-labelledby="report-update-heading"
    >
      <h2
        id="report-update-heading"
        className="text-lg font-black text-[#0C1833] sm:text-xl"
      >
        {title}
      </h2>
      <p className="mt-3 text-sm leading-7 text-slate-700">{description}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={contactHref}
          className={`${mapablePublicPrimaryButtonClass} ${mapableCareFocusRing}`}
        >
          {suggestLabel}
        </Link>
        <Link
          href={contactHref}
          className={`${mapablePublicSecondaryButtonClass} ${mapableCareFocusRing}`}
        >
          {reportLabel}
        </Link>
      </div>
    </aside>
  );
}
