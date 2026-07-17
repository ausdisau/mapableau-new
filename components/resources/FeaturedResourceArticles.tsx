import Link from "next/link";
import React from "react";

import type { ResourceArticle } from "@/lib/resources/resource-articles-data";
import {
  mapablePublicCardClass,
  mapablePublicEyebrowClass,
  mapablePublicPageContainerClass,
} from "@/lib/marketing/public-page-styles";

type FeaturedResourceArticlesProps = {
  articles: ResourceArticle[];
  title?: string;
  id?: string;
  description?: string;
};

export function FeaturedResourceArticles({
  articles,
  title = "Featured planning resources",
  id = "featured-resources",
  description = "Plain-language itineraries and checklists for low-rush, access-aware outings. Practical planning support — not medical, therapy, legal or NDIS advice.",
}: FeaturedResourceArticlesProps) {
  if (articles.length === 0) {
    return null;
  }

  return (
    <section
      id={id}
      className="border-b border-slate-200 bg-white"
      aria-labelledby={`${id}-heading`}
    >
      <div className={`${mapablePublicPageContainerClass} py-12 lg:py-16`}>
        <p className={mapablePublicEyebrowClass}>Featured</p>
        <h2
          id={`${id}-heading`}
          className="mt-2 text-2xl font-black tracking-tight text-mapable-navy sm:text-3xl"
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            {description}
          </p>
        ) : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Link
              key={article.href}
              href={article.href}
              className={`${mapablePublicCardClass} block border-[#005B7F]/20 bg-[#F6FBFC] transition hover:border-[#005B7F]/40 hover:shadow-sm focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40`}
            >
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#005B7F]">
                {article.eyebrow}
                {article.locationLabel ? ` · ${article.locationLabel}` : ""}
              </p>
              <h3 className="mt-2 text-lg font-black text-[#0C1833]">
                {article.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                {article.description}
              </p>
              <p className="mt-4 text-sm font-bold text-[#005B7F]">
                Read itinerary
                <span aria-hidden="true"> →</span>
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
