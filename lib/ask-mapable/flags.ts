/**
 * Ask MapAble embedded widget — fail-closed feature flags.
 * Server and client must both be explicitly enabled for mount.
 */

function envTruthy(value: string | undefined): boolean {
  return value === "1" || value === "true" || value === "yes";
}

export function isAskMapAbleEmbeddedEnabled(
  env: {
    NEXT_PUBLIC_ASK_MAPABLE_EMBEDDED_ENABLED?: string;
  } = {
    NEXT_PUBLIC_ASK_MAPABLE_EMBEDDED_ENABLED:
      process.env.NEXT_PUBLIC_ASK_MAPABLE_EMBEDDED_ENABLED,
  },
): boolean {
  return envTruthy(env.NEXT_PUBLIC_ASK_MAPABLE_EMBEDDED_ENABLED);
}

/** Server-side companion (optional ops kill-switch without rebuilding client). */
export function isAskMapAbleServerEnabled(
  env: { ASK_MAPABLE_EMBEDDED_ENABLED?: string } = {
    ASK_MAPABLE_EMBEDDED_ENABLED: process.env.ASK_MAPABLE_EMBEDDED_ENABLED,
  },
): boolean {
  // If unset, follow public flag only when public is true; explicit false kills server paths.
  if (env.ASK_MAPABLE_EMBEDDED_ENABLED === undefined) {
    return isAskMapAbleEmbeddedEnabled();
  }
  return envTruthy(env.ASK_MAPABLE_EMBEDDED_ENABLED);
}
