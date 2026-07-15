import React from "react";

import { mapablePublicCardClass } from "@/lib/marketing/public-page-styles";
import { businessBarrierCategories } from "@/lib/resources/business-resources-data";

export function BusinessBarrierCategoryGrid() {
  return (
    <section
      aria-labelledby="business-barrier-categories-heading"
      className="space-y-4"
    >
      <div>
        <h2
          id="business-barrier-categories-heading"
          className="text-lg font-black text-[#0C1833] sm:text-xl"
        >
          Business barrier categories
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-700">
          Use these categories to spot where customers, visitors or workers may
          meet friction. Reducing barriers is ongoing work — not a one-off
          claim.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {businessBarrierCategories.map((category) => (
          <div key={category.id} className={mapablePublicCardClass}>
            <h3 className="text-base font-black text-[#0C1833]">
              {category.title}
            </h3>
            <p className="mt-2 text-sm leading-7 text-slate-700">
              {category.summary}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
