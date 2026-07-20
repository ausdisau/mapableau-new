import Link from "next/link";
import React from "react";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import {
  mapablePublicCardClass,
  mapablePublicPrimaryButtonClass,
} from "@/lib/marketing/public-page-styles";

export function BusinessAccessSelfCheckCTA() {
  return (
    <aside className={`${mapablePublicCardClass} border-[#005B7F]/20 bg-[#F6FBFC]`}>
      <h2 className="text-lg font-black text-[#0C1833]">
        15-minute access self-check
      </h2>
      <p className="mt-3 text-sm leading-7 text-slate-700">
        Answer short questions about entrance, toilets, sensory load, staff
        assistance and online access information. Get strengths, top barriers
        and low-cost next steps.
      </p>
      <Link
        href="/resources/business/access-barrier-self-check"
        className={`${mapablePublicPrimaryButtonClass} ${mapableCareFocusRing} mt-5`}
      >
        Start the 15-minute access self-check
      </Link>
    </aside>
  );
}
