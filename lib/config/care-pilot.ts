/**
 * Greater Sydney Care pilot flags. All default OFF.
 */

function envFlag(name: string): boolean {
  return process.env[name] === "true";
}

export const carePilotConfig = {
  get introductionsEnabled(): boolean {
    return envFlag("MAPABLE_CARE_INTRODUCTIONS_ENABLED");
  },
  get compareOptionsEnabled(): boolean {
    return envFlag("MAPABLE_CARE_COMPARE_OPTIONS_ENABLED");
  },
  get transportLinkOnlyEnabled(): boolean {
    return envFlag("MAPABLE_CARE_TRANSPORT_LINK_ENABLED");
  },
  /** Master — when false, pilot spine APIs remain closed. */
  get spineEnabled(): boolean {
    return envFlag("MAPABLE_CARE_PILOT_SPINE_ENABLED");
  },
};

export function isCareIntroductionsEnabled(): boolean {
  return carePilotConfig.spineEnabled && carePilotConfig.introductionsEnabled;
}

export function isCareCompareEnabled(): boolean {
  return carePilotConfig.spineEnabled && carePilotConfig.compareOptionsEnabled;
}

export function isCareTransportLinkEnabled(): boolean {
  return carePilotConfig.spineEnabled && carePilotConfig.transportLinkOnlyEnabled;
}
