import type { MetadataRoute } from "next";

import { isShoppingEnabled } from "@/lib/config/shopping";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.mapable.com.au";

const publicRoutes = [
  "",
  "/care",
  "/transport",
  "/employment",
  "/marketplace",
  "/foods",
  "/access",
  "/peer",
  "/telehealth",
  "/providers",
  "/provider-finder",
  "/resources",
  "/help",
  "/about",
  "/pricing",
  "/contact",
  "/for-providers",
  "/privacy",
  "/terms",
  "/data-deletion",
  "/accessibility-statement",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes = isShoppingEnabled()
    ? [...publicRoutes.slice(0, 5), "/shopping", ...publicRoutes.slice(5)]
    : publicRoutes;

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
