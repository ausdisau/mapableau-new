import type { MetadataRoute } from "next";

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
  "/resources/business",
  "/resources/business/access-barrier-self-check",
  "/resources/business/venue-accessibility-self-check",
  "/resources/business/accessibility-statement-generator",
  "/resources/business/accessible-entrance-and-path",
  "/resources/business/accessible-toilet-information",
  "/resources/business/sensory-friendly-business",
  "/resources/business/accessible-customer-service",
  "/resources/business/digital-access-checklist",
  "/resources/business/inclusive-hiring",
  "/resources/business/workplace-adjustments",
  "/resources/business/accessible-events",
  "/resources/business/complaints-and-access-feedback",
  "/resources/business/accreditation-readiness",
  "/guides",
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

  return publicRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
