export type ResourceArticle = {
  slug: string;
  title: string;
  description: string;
  eyebrow: string;
  href: string;
  featured: boolean;
  audience: string[];
  locationLabel?: string;
  relatedGuideHref?: string;
  checklistDownloadHref?: string;
  tags: string[];
};

/**
 * Detailed MapAble resource articles (itineraries, checklists, planners).
 * Separate from Access Guides and module hub links.
 */
export const resourceArticles: ResourceArticle[] = [
  {
    slug: "sensory-friendly-canberra-half-day-itinerary",
    title: "Sensory-Friendly Canberra Half-Day Itinerary",
    description:
      "A calm, low-rush half-day outing linking the National Museum of Australia and the National Arboretum — for visitors who need predictable steps, quiet options and accessible planning notes.",
    eyebrow: "Canberra itinerary",
    href: "/resources/sensory-friendly-canberra-half-day-itinerary",
    featured: true,
    audience: [
      "People with disability",
      "Neurodivergent visitors",
      "Families and carers",
      "Support coordinators",
    ],
    locationLabel: "Canberra, ACT",
    relatedGuideHref: "/guides/act/canberra-accessibility-guide",
    checklistDownloadHref:
      "/resources/itineraries/MapAble_Sensory_Friendly_Canberra_Half_Day_Checklist.txt",
    tags: ["sensory-friendly", "canberra", "half-day", "itinerary"],
  },
];

export function getFeaturedResourceArticles(): ResourceArticle[] {
  return resourceArticles.filter((article) => article.featured);
}

export function getResourceArticleBySlug(
  slug: string,
): ResourceArticle | undefined {
  return resourceArticles.find((article) => article.slug === slug);
}
