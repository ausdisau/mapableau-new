/**
 * Access Signals feature flags — fail-closed.
 * Does not enable Access Infrastructure or Access Graph flags.
 */

function envTruthy(key: string, env: NodeJS.ProcessEnv = process.env): boolean {
  const v = env[key];
  return v === "1" || v === "true" || v === "yes";
}

export function isAccessSignalsEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const productionLocked =
    env.NODE_ENV === "production" || env.VERCEL_ENV === "production";
  if (productionLocked) return false;
  return envTruthy("MAPABLE_ACCESS_SIGNALS_ENABLED", env);
}

export const accessSignalsFlags = {
  enabled: isAccessSignalsEnabled,
};
