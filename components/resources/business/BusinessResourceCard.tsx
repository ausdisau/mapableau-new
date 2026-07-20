import Link from "next/link";
import React from "react";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import { mapablePublicCardClass } from "@/lib/marketing/public-page-styles";
import {
  formatBusinessAudience,
  formatBusinessFormat,
} from "@/lib/resources/business-resources-data";
import type { BusinessResource } from "@/types/business-resource";

type BusinessResourceCardProps = {
  resource: BusinessResource;
};

export function BusinessResourceCard({ resource }: BusinessResourceCardProps) {
  return (
    <article>
      <Link
        href={resource.href}
        className={`${mapablePublicCardClass} block h-full transition hover:border-[#005B7F]/30 hover:shadow-sm ${mapableCareFocusRing}`}
      >
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#005B7F]">
          {resource.category} · {formatBusinessFormat(resource.format)}
        </p>
        <h3 className="mt-2 text-lg font-black text-[#0C1833]">
          {resource.title}
        </h3>
        <p className="mt-3 text-sm leading-7 text-slate-700">
          {resource.summary}
        </p>
        <p className="mt-3 text-xs font-semibold text-slate-500">
          For{" "}
          {resource.audience.map((item) => formatBusinessAudience(item)).join(", ")}
        </p>
        <p className="mt-4 text-sm font-bold text-[#005B7F]">
          {resource.cta}
          <span aria-hidden="true"> →</span>
        </p>
      </Link>
    </article>
  );
}
