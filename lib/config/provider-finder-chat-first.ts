/**
 * Chat-first Provider Finder v2 — fail-closed preview flag.
 * Does not enable booking, matching, or live NDIS registration claims.
 */

function envFlag(
  name: string,
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  return env[name] === "true";
}

export function isProviderFinderChatFirstV2Enabled(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  return envFlag("MAPABLE_PROVIDER_FINDER_CHAT_FIRST_V2_ENABLED", env);
}

/**
 * Results pane follows a completed turn after applied fields have landed.
 * Agent metadata is streamed before interpretation, so complete alone must
 * not reveal the previous (or empty) filter set.
 */
export function shouldRevealChatFirstResults(
  status: string | undefined,
  interpretationApplied = false,
): boolean {
  return status === "complete" && interpretationApplied;
}
