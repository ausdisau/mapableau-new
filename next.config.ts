import type { NextConfig } from "next";

import { getWixFrameAncestors } from "@/lib/integrations/wix/config";

const nextConfig: NextConfig = {
  reactStrictMode: true, // Enables additional React checks in dev
  // todo: check where this is applied and how it works
  async headers() {
    return [
      {
        source: "/data/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=43200, s-maxage=43200", // 5 days
          },
        ],
      },
      {
        source: "/embed/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `frame-ancestors ${getWixFrameAncestors()}`,
          },
        ],
      },
    ];
  },
  eslint: {
    dirs: ["app", "components", "lib"],
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false, // Ensures type safety at build time
  },
};

export default nextConfig;
