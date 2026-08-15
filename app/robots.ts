import type { MetadataRoute } from "next";

import { getCanonicalPublicOrigin } from "@/lib/config/canonical-url";

const baseUrl = getCanonicalPublicOrigin();

/** Named AI / training crawlers — no indexing of transactional surfaces. */
const AI_CRAWLER_AGENTS = [
  "GPTBot",
  "ChatGPT-User",
  "anthropic-ai",
  "Claude-Web",
  "ClaudeBot",
  "Bytespider",
  "CCBot",
  "Google-Extended",
  "Amazonbot",
  "PerplexityBot",
] as const;

const TRANSACTIONAL_DISALLOW = [
  "/admin",
  "/api",
  "/dashboard",
  "/provider",
  "/worker",
  "/driver",
  "/messages",
  "/my-access",
  "/login",
  "/register",
] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
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
        ],
        disallow: [...TRANSACTIONAL_DISALLOW],
      },
      ...AI_CRAWLER_AGENTS.map((userAgent) => ({
        userAgent,
        disallow: ["/"] as string[],
      })),
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
