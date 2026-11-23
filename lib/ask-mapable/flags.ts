/**
 * Ask MapAble embedded experiences — public and authenticated capability
 * flags are separate. Both default OFF. Neither relaxes backend auth.
 */
function envTruthy(value: string | undefined): boolean {
  return value === "1" || value === "true" || value === "yes";
}

export function isAskMapAbleEmbeddedEnabled(
  env: { NEXT_PUBLIC_ASK_MAPABLE_EMBEDDED_ENABLED?: string } = {
    NEXT_PUBLIC_ASK_MAPABLE_EMBEDDED_ENABLED:
      process.env.NEXT_PUBLIC_ASK_MAPABLE_EMBEDDED_ENABLED,
  },
): boolean {
  return envTruthy(env.NEXT_PUBLIC_ASK_MAPABLE_EMBEDDED_ENABLED);
}

/** Public read-only discovery UI only, using the existing public finder chat. */
export function isAskMapAbleGuestEnabled(
  env: { NEXT_PUBLIC_MAPABLE_PUBLIC_ACCESS_ASSISTANT_ENABLED?: string } = {
    NEXT_PUBLIC_MAPABLE_PUBLIC_ACCESS_ASSISTANT_ENABLED:
      process.env.NEXT_PUBLIC_MAPABLE_PUBLIC_ACCESS_ASSISTANT_ENABLED,
  },
): boolean {
  return envTruthy(env.NEXT_PUBLIC_MAPABLE_PUBLIC_ACCESS_ASSISTANT_ENABLED);
}

/** Server-side companion (optional ops kill-switch without rebuilding client). */
export function isAskMapAbleServerEnabled(
  env: { ASK_MAPABLE_EMBEDDED_ENABLED?: string } = {
    ASK_MAPABLE_EMBEDDED_ENABLED: process.env.ASK_MAPABLE_EMBEDDED_ENABLED,
  },
): boolean {
  // Existing authenticated behaviour is preserved.
  if (env.ASK_MAPABLE_EMBEDDED_ENABLED === undefined) {
    return isAskMapAbleEmbeddedEnabled();
  }
  return envTruthy(env.ASK_MAPABLE_EMBEDDED_ENABLED);
}
