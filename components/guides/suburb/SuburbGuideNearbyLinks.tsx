import Link from "next/link";
import React from "react";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import { mapablePublicMutedCardClass } from "@/lib/marketing/public-page-styles";
import type { SuburbAccessGuide } from "@/types/suburb-access-guide";

type SuburbGuideNearbyLinksProps = {
  guide: SuburbAccessGuide;
};

export function SuburbGuideNearbyLinks({ guide }: SuburbGuideNearbyLinksProps) {
  return (
    <section
      className={mapablePublicMutedCardClass}
      aria-labelledby="suburb-nearby-heading"
    >
      <h2
        id="suburb-nearby-heading"
        className="text-lg font-black text-[#0C1833]"
      >
        Nearby suburbs and parent guide
      </h2>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
        {guide.parentCityGuideHref && guide.parentCityGuideLabel ? (
          <li>
            Parent city/town guide:{" "}
            <Link
              href={guide.parentCityGuideHref}
              className={`font-medium text-primary underline-offset-2 hover:underline ${mapableCareFocusRing}`}
            >
              {guide.parentCityGuideLabel}
            </Link>
          </li>
        ) : (
          <li>Parent city/town guide not linked yet for this locality.</li>
        )}
        {guide.nearbyGuides.length === 0 ? (
          <li>Nearby suburb guides will appear here as the national catalogue grows.</li>
        ) : (
          guide.nearbyGuides.map((nearby) => (
            <li key={nearby.salCode}>
              <Link
                href={nearby.href}
                className={`font-medium text-primary underline-offset-2 hover:underline ${mapableCareFocusRing}`}
              >
                {nearby.name} ({nearby.state})
              </Link>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
