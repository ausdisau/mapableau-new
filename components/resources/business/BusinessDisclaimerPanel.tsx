import React from "react";

import { mapablePublicMutedCardClass } from "@/lib/marketing/public-page-styles";
import { BUSINESS_RESOURCES_DISCLAIMER } from "@/lib/resources/business-resources-data";

type BusinessDisclaimerPanelProps = {
  id?: string;
};

export function BusinessDisclaimerPanel({
  id = "business-disclaimer",
}: BusinessDisclaimerPanelProps) {
  return (
    <aside
      id={id}
      className={`${mapablePublicMutedCardClass} border-amber-200 bg-amber-50`}
      role="note"
    >
      <h2 className="text-lg font-black text-amber-950">Disclaimer</h2>
      <p className="mt-3 text-sm leading-7 text-amber-950">
        {BUSINESS_RESOURCES_DISCLAIMER}
      </p>
    </aside>
  );
}
