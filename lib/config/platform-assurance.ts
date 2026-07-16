/**
 * Platform Assurance feature flags. All default false — production capabilities
 * must not be enabled by a client-supplied header.
 */
export const platformAssuranceConfig = {
  platformAssuranceEnabled:
    process.env.PLATFORM_ASSURANCE_ENABLED === "true",
  workerTrustCentreEnabled:
    process.env.WORKER_TRUST_CENTRE_ENABLED === "true",
};

export function isPlatformAssuranceEnabled(): boolean {
  return platformAssuranceConfig.platformAssuranceEnabled;
}

export function isWorkerTrustCentreEnabled(): boolean {
  return platformAssuranceConfig.workerTrustCentreEnabled;
}

/** Shown on every assurance UI — MapAble does not declare legal classification. */
export const PLATFORM_ASSURANCE_DISCLAIMER =
  "MapAble has not declared that it is an NDIS-registered digital platform, legally compliant, certified, or approved. Scope results are structured review opinions for human and legal review only — not legal advice.";
