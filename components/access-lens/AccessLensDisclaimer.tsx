import React from "react";

import { mapablePublicMutedCardClass } from "@/lib/marketing/public-page-styles";
import {
  VISION_ACCESS_DISCLAIMER,
  VISION_ACCESS_TRUST_NOTE,
} from "@/lib/vision-access";

type AccessLensDisclaimerProps = {
  id?: string;
  compact?: boolean;
};

export function AccessLensDisclaimer({
  id = "access-lens-disclaimer",
  compact = false,
}: AccessLensDisclaimerProps) {
  return (
    <aside
      id={id}
      className={mapablePublicMutedCardClass}
      aria-label="Access Lens limitations"
    >
      <p className="text-sm font-black text-mapable-navy">{VISION_ACCESS_TRUST_NOTE}</p>
      {!compact ? (
        <p className="mt-3 text-sm leading-6 text-slate-600">{VISION_ACCESS_DISCLAIMER}</p>
      ) : null}
    </aside>
  );
}
