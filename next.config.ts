import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true, // Enables additional React checks in dev
  async redirects() {
    return [
      { source: "/dashboard/transport", destination: "/transport", permanent: false },
      { source: "/dashboard/transport/new", destination: "/transport/book", permanent: false },
      {
        source: "/dashboard/transport/:id",
        destination: "/transport/trips/:id",
        permanent: false,
      },
    ];
  },
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
