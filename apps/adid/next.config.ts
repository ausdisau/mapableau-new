import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

const portalRoot = fileURLToPath(new URL(".", import.meta.url));
const config: NextConfig = {
  reactStrictMode: true,
  turbopack: { root: portalRoot },
};
export default config;
