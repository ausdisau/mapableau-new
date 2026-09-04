/**
 * Environment-aware Node heap for `next build`.
 *
 * History on default ~8 GB Vercel builders (PR #390 / #413):
 * - 7168 → SIGKILL (RSS)
 * - 5632 → JS heap OOM during lint+tsc when eslint ran in-build
 * - 6144 → still SIGKILL with eslint in-build
 * - 5120 → headroom while Vercel still ran in-build tsc
 *
 * After eslint + tsc are skipped inside `next build` on Vercel (CI remains the
 * lint/type gate), restore 6144 for SSG. Do not raise to 7168 without a larger
 * build machine (OWNER_ACTION_REQUIRED).
 *
 * Override with MAPABLE_BUILD_HEAP_MB when needed.
 */

/**
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {number}
 */
export function resolveHeapMb(env = process.env) {
  const override = env.MAPABLE_BUILD_HEAP_MB;
  if (override && Number.isFinite(Number(override))) {
    return Number(override);
  }
  if (env.VERCEL === "1") {
    return 6144;
  }
  if (env.GITHUB_ACTIONS === "true") {
    return 8192;
  }
  return 6144;
}
