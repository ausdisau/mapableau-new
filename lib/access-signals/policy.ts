/**
 * Access Signals synthetic demo — default off, production hard-off.
 * Does not enable AccessCast, live place ratings, or remediation backends.
 */

export function isAccessSignalsDemoEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  const productionLocked =
    env.NODE_ENV === "production" || env.VERCEL_ENV === "production";
  return (
    env.MAPABLE_ACCESS_SIGNALS_DEMO_ENABLED === "true" && !productionLocked
  );
}
