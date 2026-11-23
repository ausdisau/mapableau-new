import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const configDir = path.dirname(fileURLToPath(import.meta.url));

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@mapable/firebase"],
  turbopack: {
    root: path.join(configDir, "../.."),
  },
};

export default config;
