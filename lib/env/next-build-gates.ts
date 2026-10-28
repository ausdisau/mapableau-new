/**
 * Next.js in-build lint/typecheck gates.
 *
 * GitHub CI already runs `pnpm lint` and `pnpm type-check` as required checks.
 * Vercel default builders OOM when `next build` repeats that work on the full
 * graph. Local builds still lint and typecheck inside `next build`.
 *
 * Does not control assertDeployedProductionEnv — Production env stays fail-closed.
 */

export function shouldSkipNextBuildEslint(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env.VERCEL === "1" || env.GITHUB_ACTIONS === "true";
}

export function shouldSkipNextBuildTypecheck(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env.VERCEL === "1" || env.GITHUB_ACTIONS === "true";
}
