import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true, // Enables additional React checks in dev
  async redirects() {
    return [
      { source: "/participant/bookings", destination: "/dashboard/bookings", permanent: false },
      { source: "/transport/book", destination: "/dashboard/transport/new", permanent: false },
    ];
  },
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
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
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
