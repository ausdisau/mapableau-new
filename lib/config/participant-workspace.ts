/**
 * Participant workspace flags — fail-closed.
 * AI-assisted My Day view is optional and off by default.
 */

function envFlag(name: string, env: NodeJS.ProcessEnv = process.env): boolean {
  return env[name] === "true";
}

export const participantWorkspaceFlags = {
  /** Enables grouped left-nav workspace chrome on /dashboard*. Default true for this vertical slice once shipped behind code; keep opt-out via false. */
  sidebarEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
    // Default on for dashboard shell redesign; set MAPABLE_PARTICIPANT_WORKSPACE_SIDEBAR=false to revert to horizontal nav.
    if (env.MAPABLE_PARTICIPANT_WORKSPACE_SIDEBAR === "false") return false;
    return true;
  },
  /** Read-only continuity review; OFF by default and not a booking authority. */
  dayContinuityReviewEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
    return envFlag("MAPABLE_DAY_CONTINUITY_REVIEW_ENABLED", env);
  },
  /** Optional AI-assisted My Day panel. Requires CareOS AI flags + consent separately. */
  aiAssistedViewEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
    return envFlag("MAPABLE_PARTICIPANT_MY_DAY_AI_ENABLED", env);
  },
};

export type ParticipantWorkspaceFlags = typeof participantWorkspaceFlags;
