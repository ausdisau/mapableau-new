/**
 * MapAble Day 2.0 flags — fail-closed. All demos default off.
 * Live writes and QR remain hard-off regardless of other day flags.
 */

function envFlag(name: string, env: NodeJS.ProcessEnv = process.env): boolean {
  return env[name] === "true";
}

export const mapableDayFlags = {
  /** Progressive disclosure sections on My Day (Changes, etc.). */
  v2Enabled(env: NodeJS.ProcessEnv = process.env): boolean {
    return envFlag("MAPABLE_DAY_V2_ENABLED", env);
  },
  routinesDemoEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
    return this.v2Enabled(env) && envFlag("MAPABLE_DAY_ROUTINES_DEMO_ENABLED", env);
  },
  handoverDemoEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
    return this.v2Enabled(env) && envFlag("MAPABLE_DAY_HANDOVER_DEMO_ENABLED", env);
  },
  continuityDemoEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
    return this.v2Enabled(env) && envFlag("MAPABLE_DAY_CONTINUITY_DEMO_ENABLED", env);
  },
  /** Always fail-closed in this increment — never enable from demos. */
  qrAccessEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
    return false && envFlag("MAPABLE_DAY_QR_ACCESS_ENABLED", env);
  },
  /** Always fail-closed — Day preview never mutates SOR. */
  liveWritesEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
    return false && envFlag("MAPABLE_DAY_LIVE_WRITES_ENABLED", env);
  },
};

export type MapAbleDayFlags = typeof mapableDayFlags;
