import type { MetadataRoute } from "next";

import { getCanonicalPublicOrigin } from "@/lib/config/canonical-url";

const baseUrl = getCanonicalPublicOrigin();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard/",
          "/provider/",
          "/worker/",
          "/driver/",
          "/messages/",
          "/practitioner/",
          "/admin/",
          "/my/",
          "/login",
          "/register",
          "/care/request",
          "/transport/request",
          "/transport/book",
          "/marketplace/browse",
          "/marketplace/cart",
          "/marketplace/products",
          "/provider/ndis-claims",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
