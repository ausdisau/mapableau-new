/**
 * MapAble Domain Services — self-serve white-label hosting registration.
 * All flags default OFF (fail-closed).
 */

function enabled(name: string, defaultOn = false) {
  const value = process.env[name];
  if (value === undefined) return defaultOn;
  return value === "true";
}

export const domainServicesConfig = {
  /** Master switch for self-serve provider cloud hosting registration wizard + APIs. */
  get selfServeEnabled() {
    return enabled("MAPABLE_DOMAIN_SERVICES_SELF_SERVE_ENABLED");
  },
  /** Proposed apex for branding-only hostnames (not live DNS). */
  get proposedHostSuffix() {
    return (
      process.env.MAPABLE_DOMAIN_SERVICES_HOST_SUFFIX?.trim() ||
      "mapable.com.au"
    );
  },
} as const;

export function ensureDomainServicesSelfServeEnabled() {
  if (!domainServicesConfig.selfServeEnabled) {
    throw new Error("DOMAIN_SERVICES_SELF_SERVE_DISABLED");
  }
}

export function isDomainServicesSelfServeEnabled() {
  return domainServicesConfig.selfServeEnabled;
}
