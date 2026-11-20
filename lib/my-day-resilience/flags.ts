/**
 * My Day Resilience Simulator (Horizon P07) — synthetic-only, production hard-disabled.
 */

function envTrue(name: string): boolean {
  const v = process.env[name];
  return v === "true" || v === "1";
}

/** Permanent denies — always false regardless of environment. */
export const MY_DAY_RESILIENCE_PERMANENT_DENY = {
  autoBooking: false,
  autoReschedule: false,
  liveWorkerScreening: false,
  governmentApi: false,
  externalPayments: false,
  realParticipantData: false,
  emergencyDispatch: false,
  autoAssignment: false,
} as const;

/**
 * Demo is deliberately impossible to enable in production.
 * Requires MAPABLE_MY_DAY_RESILIENCE_ENABLED=true AND NODE_ENV !== "production".
 */
export function isMyDayResilienceEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return (
    env.NODE_ENV !== "production" &&
    (env.MAPABLE_MY_DAY_RESILIENCE_ENABLED === "true" ||
      env.MAPABLE_MY_DAY_RESILIENCE_ENABLED === "1")
  );
}

export function myDayResilienceFlagSnapshot(
  env: NodeJS.ProcessEnv = process.env,
) {
  return {
    enabled: isMyDayResilienceEnabled(env),
    envRequested: envTrue("MAPABLE_MY_DAY_RESILIENCE_ENABLED"),
    nodeEnv: env.NODE_ENV ?? "undefined",
    permanentDeny: MY_DAY_RESILIENCE_PERMANENT_DENY,
    productionClaim: "none" as const,
  };
}
