import React from "react";

import {
  mapablePublicCardClass,
  mapablePublicSectionTitleClass,
} from "@/lib/marketing/public-page-styles";
import { visionAccessPrivacyBullets } from "@/lib/vision-access";

export function AccessLensPrivacyPanel() {
  return (
    <section
      aria-labelledby="access-lens-privacy-heading"
      id="privacy"
      className="scroll-mt-24"
    >
      <p className={mapablePublicSectionTitleClass}>Privacy</p>
      <h2
        id="access-lens-privacy-heading"
        className="mapable-display mt-2 text-2xl font-black tracking-[-0.04em] text-mapable-navy sm:text-3xl"
      >
        Privacy by design
      </h2>
      <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
        Access Lens is designed so people can review provisional access candidates without
        giving up unnecessary personal data. This Wave 1 demo does not open the camera or
        upload images.
      </p>
      <ul className={`mt-6 space-y-3 ${mapablePublicCardClass}`}>
        {visionAccessPrivacyBullets.map((item) => (
          <li key={item} className="text-sm leading-6 text-slate-700">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
