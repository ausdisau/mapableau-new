#!/usr/bin/env node
/**
 * Next.js production build with environment-aware heap caps.
 *
 * Vercel preview builders SIGKILL when Node heap is set near the container RSS
 * limit (observed with --max-old-space-size=7168). After in-build eslint+tsc
 * are skipped on Vercel, default heap is 6144. GitHub Accessibility needs a
 * higher ceiling after SSG concurrency was reduced to 1.
 *
 * Override with MAPABLE_BUILD_HEAP_MB when needed.
 */
import { spawnSync } from "node:child_process";

import { resolveHeapMb } from "./resolve-next-build-heap.mjs";

const heapMb = resolveHeapMb(process.env);
console.log(`[run-next-build] max-old-space-size=${heapMb}`);

const result = spawnSync(
  process.execPath,
  [
    `--max-old-space-size=${heapMb}`,
    "node_modules/next/dist/bin/next",
    "build",
    ...process.argv.slice(2),
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      // Avoid a parent NODE_OPTIONS heap fighting the explicit flag above.
      NODE_OPTIONS: (process.env.NODE_OPTIONS || "")
        .split(/\s+/)
        .filter(Boolean)
        .filter((part) => !part.startsWith("--max-old-space-size"))
        .join(" "),
    },
  },
);

process.exit(result.status ?? 1);
