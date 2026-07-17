import type { MetadataRoute } from "next";

import {
  getSuburbGuideStates,
  getSuburbGuidesByState,
  isSuburbGuideIndexable,
} from "@/lib/resources/suburb-access-guides-data";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.mapable.com.au";

/**
 * Sitemap indexes by state for suburb Access Guides.
 * Only indexable guides are included (thin drafts stay out of search).
 * Served as /guides/suburbs/sitemap/[id].xml
 */
export async function generateSitemaps() {
  return getSuburbGuideStates().map((id) => ({ id }));
}

export default async function sitemap(props: {
  id: Promise<string> | string;
}): Promise<MetadataRoute.Sitemap> {
  const id = typeof props.id === "string" ? props.id : await props.id;
  const guides = getSuburbGuidesByState(id).filter(isSuburbGuideIndexable);

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/guides/suburbs`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  for (const guide of guides) {
    entries.push({
      url: `${baseUrl}${guide.href}`,
      lastModified: new Date(guide.lastUpdated),
      changeFrequency: "monthly",
      priority: 0.6,
    });
    if (
      guide.guideStatus === "mapable-verified" ||
      guide.guideStatus === "mapable-reviewed"
    ) {
      entries.push({
        url: `${baseUrl}${guide.mapHref}`,
        lastModified: new Date(guide.lastUpdated),
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }
  }

  return entries;
}
