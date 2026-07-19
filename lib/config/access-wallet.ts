/** Portable Access Wallet flags. Production issuance must remain false. */

function envFlag(name: string, defaultEnabled = false): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultEnabled;
  return raw === "true";
}

export const accessWalletConfig = {
  get enabled() {
    return envFlag("MAPABLE_ACCESS_WALLET_ENABLED", false);
  },
  get verifiableCredentialsEnabled() {
    return envFlag("MAPABLE_VERIFIABLE_CREDENTIALS_ENABLED", false);
  },
  get openid4vciEnabled() {
    return envFlag("MAPABLE_OPENID4VCI_ENABLED", false);
  },
  get openid4vpEnabled() {
    return envFlag("MAPABLE_OPENID4VP_ENABLED", false);
  },
  /** Hard fail-closed for production issuance during this programme. */
  get productionIssuanceEnabled() {
    return envFlag("MAPABLE_WALLET_PRODUCTION_ISSUANCE_ENABLED", false);
  },
  authorityCeiling: "SYNTHETIC_PRESENTATION_ONLY" as const,
  productionClaimStatus: "not_claimable" as const,
  maturity: "contract_only" as const,
  /** Never claim government, NDIS, or national digital-identity endorsement. */
  endorsementClaim: "none" as const,
};
