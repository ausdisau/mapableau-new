/**
 * Runtime kill-switch helpers.
 * Global kill is env-driven; entity kills use status fields from DB.
 */

export type KillSwitchState = {
  global: boolean;
  providers: Record<string, boolean>;
  campaigns: Record<string, boolean>;
  advertisers: Record<string, boolean>;
  placements: Record<string, boolean>;
  surfaces: Record<string, boolean>;
};

export function createEmptyKillSwitchState(
  global = false,
): KillSwitchState {
  return {
    global,
    providers: {},
    campaigns: {},
    advertisers: {},
    placements: {},
    surfaces: {},
  };
}

export function isKilled(
  state: KillSwitchState,
  opts: {
    providerId?: string;
    campaignId?: string;
    advertiserId?: string;
    placementCode?: string;
    surface?: string;
  },
): { killed: true; scope: string } | { killed: false } {
  if (state.global) return { killed: true, scope: "global" };
  if (opts.providerId && state.providers[opts.providerId] === false) {
    return { killed: true, scope: "provider" };
  }
  if (opts.campaignId && state.campaigns[opts.campaignId] === false) {
    return { killed: true, scope: "campaign" };
  }
  if (opts.advertiserId && state.advertisers[opts.advertiserId] === false) {
    return { killed: true, scope: "advertiser" };
  }
  if (opts.placementCode && state.placements[opts.placementCode] === false) {
    return { killed: true, scope: "placement" };
  }
  if (opts.surface && state.surfaces[opts.surface] === false) {
    return { killed: true, scope: "surface" };
  }
  return { killed: false };
}
