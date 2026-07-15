import Link from "next/link";
import React from "react";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import {
  mapablePublicCardClass,
  mapablePublicSecondaryButtonClass,
} from "@/lib/marketing/public-page-styles";

export function BusinessAccessStatementCTA() {
  return (
    <aside className={mapablePublicCardClass}>
      <h2 className="text-lg font-black text-[#0C1833]">
        Accessibility statement
      </h2>
      <p className="mt-3 text-sm leading-7 text-slate-700">
        Draft a plain-language statement that describes what is known, what is
        limited and how people can request updates — without claiming legal
        compliance.
      </p>
      <Link
        href="/resources/business/accessibility-statement-generator"
        className={`${mapablePublicSecondaryButtonClass} ${mapableCareFocusRing} mt-5`}
      >
        Create an accessibility statement
      </Link>
    </aside>
  );
}
