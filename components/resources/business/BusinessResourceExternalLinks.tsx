import Link from "next/link";
import React from "react";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import { mapablePublicCardClass } from "@/lib/marketing/public-page-styles";
import { businessResourceExternalLinks } from "@/lib/resources/business-resources-data";

export function BusinessResourceExternalLinks() {
  return (
    <section
      aria-labelledby="business-related-links-heading"
      className="space-y-4"
    >
      <h2
        id="business-related-links-heading"
        className="text-lg font-black text-[#0C1833] sm:text-xl"
      >
        Related MapAble links
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {businessResourceExternalLinks.map((link) => (
          <li key={link.id}>
            <Link
              href={link.href}
              className={`${mapablePublicCardClass} block transition hover:border-[#005B7F]/30 ${mapableCareFocusRing}`}
            >
              <p className="font-black text-[#0C1833]">{link.label}</p>
              <p className="mt-2 text-sm leading-7 text-slate-700">{link.note}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
