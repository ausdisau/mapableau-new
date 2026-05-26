import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true, // Enables additional React checks in dev
  async redirects() {
    return [
      { source: "/dashboard/care", destination: "/care", permanent: true },
      { source: "/dashboard/care/new", destination: "/care/request", permanent: true },
      { source: "/dashboard/care/shifts", destination: "/care/shifts", permanent: true },
      {
        source: "/dashboard/care/shifts/:shiftId",
        destination: "/care/shifts/:shiftId",
        permanent: true,
      },
      { source: "/dashboard/messages", destination: "/messages", permanent: true },
      {
        source: "/dashboard/messages/:conversationId",
        destination: "/messages/:conversationId",
        permanent: true,
      },
      { source: "/care/find", destination: "/provider-finder", permanent: false },
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
