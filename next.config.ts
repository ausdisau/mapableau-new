import type { NextConfig } from "next";

import { getBaselineSecurityHeaders } from "./lib/security/headers";

/**
 * Vercel Hobby/Pro build machines are ~8 GB. Full Next lint+tsc during
 * `next build` OOMs on this codebase. Keep lint/typecheck authoritative in
 * GitHub Actions (`pnpm lint` / `pnpm type-check`); only lighten the Vercel
 * compile path. Never set ignoreDuringBuilds/ignoreBuildErrors to a bare
 * `true` — ci:feature-dependencies forbids that.
 */
const vercelLightBuild = process.env.VERCEL === "1";

const nextConfig: NextConfig = {
  reactStrictMode: true, // Enables additional React checks in dev
  // Limit parallelism so lint+tsc workers are not SIGKILL'd on small builders.
  experimental: {
    cpus: 1,
  },
  async redirects() {
    return [
      {
        // Public employment module is canonical; keep /jobs as a compatibility alias.
        source: "/jobs",
        destination: "/employment",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: getBaselineSecurityHeaders(),
      },
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
    // tests/ linted via `pnpm lint:tests` (tracked debt; not ignored during builds for app code).
    dirs: ["app", "components", "lib", "schemas", "scripts/ci"],
    ignoreDuringBuilds: vercelLightBuild,
  },
  typescript: {
    ignoreBuildErrors: vercelLightBuild,
  },
};

export default nextConfig;
