/**
 * Support Intelligence capabilities default to disabled (fail-closed).
 * A malformed env value never enables a capability.
 * Values are read on each access so tests can toggle env safely.
 */
function enabled(name: string, defaultValue = false): boolean {
  const value = process.env[name];
  if (value === undefined) return defaultValue;
  return value === "true";
}

export const supportIntelligenceFlags = {
  get enabled() {
    return enabled("MAPABLE_SUPPORT_INTEL_ENABLED");
  },
  get killSwitch() {
    return enabled("MAPABLE_SUPPORT_INTEL_KILL_SWITCH");
  },
  get spiderEnabled() {
    return enabled("MAPABLE_SUPPORT_INTEL_SPIDER_ENABLED");
  },
  get spiderCrawlEnabled() {
    return enabled("MAPABLE_SUPPORT_INTEL_SPIDER_CRAWL_ENABLED");
  },
  get snaEnabled() {
    return enabled("MAPABLE_SUPPORT_INTEL_SNA_ENABLED");
  },
  get smaEnabled() {
    return enabled("MAPABLE_SUPPORT_INTEL_SMA_ENABLED");
  },
  get regulatoryGatewayEnabled() {
    return enabled("MAPABLE_SUPPORT_INTEL_REG_GATEWAY_ENABLED");
  },
  get workerVerificationEnabled() {
    return enabled("MAPABLE_SUPPORT_INTEL_WVG_ENABLED");
  },
  get demandIntelEnabled() {
    return enabled("MAPABLE_SUPPORT_INTEL_DEMAND_ENABLED");
  },
  get searchIntegrationEnabled() {
    return enabled("MAPABLE_SUPPORT_INTEL_SEARCH_ENABLED");
  },
  get bookingEnabled() {
    return enabled("MAPABLE_SUPPORT_INTEL_BOOKING_ENABLED");
  },
  get paymentEnabled() {
    return enabled("MAPABLE_SUPPORT_INTEL_PAYMENT_ENABLED");
  },
  get dispatchEnabled() {
    return enabled("MAPABLE_SUPPORT_INTEL_DISPATCH_ENABLED");
  },
};

export type SupportIntelligenceCapability =
  | "spider"
  | "sna"
  | "sma"
  | "regulatory"
  | "worker_verification"
  | "demand"
  | "search";

export function isSupportIntelligenceLive(): boolean {
  return (
    supportIntelligenceFlags.enabled &&
    !supportIntelligenceFlags.killSwitch
  );
}

export function isCapabilityEnabled(
  capability: SupportIntelligenceCapability,
): boolean {
  if (!isSupportIntelligenceLive()) return false;
  switch (capability) {
    case "spider":
      return supportIntelligenceFlags.spiderEnabled;
    case "sna":
      return supportIntelligenceFlags.snaEnabled;
    case "sma":
      return supportIntelligenceFlags.smaEnabled;
    case "regulatory":
      return supportIntelligenceFlags.regulatoryGatewayEnabled;
    case "worker_verification":
      return supportIntelligenceFlags.workerVerificationEnabled;
    case "demand":
      return supportIntelligenceFlags.demandIntelEnabled;
    case "search":
      return supportIntelligenceFlags.searchIntegrationEnabled;
    default: {
      const _exhaustive: never = capability;
      return _exhaustive;
    }
  }
}

/** v0.1 hard deny — operational transaction lanes stay closed. */
export function hardDenyOperationalActions(): {
  booking: false;
  payment: false;
  dispatch: false;
  reason: string;
} {
  return {
    booking: false,
    payment: false,
    dispatch: false,
    reason:
      "Support Intelligence v0.1 keeps booking, payment and autonomous dispatch disabled until registration, operational and safeguarding gates pass.",
  };
}
