/**
 * AD.iD feature gates — all default OFF.
 * Never enable linking, Wix bridge, or cross-app federation without human approval.
 * Note: relative imports use `.ts` suffixes so Node's test runner can resolve ESM.
 */

function envTrue(name: string): boolean {
  return process.env[name] === "true";
}

export const adidFlags = {
  /** Optional Neon public.services directory (read-only). Also requires ADID_NEON_DIRECTORY_ENABLED legacy alias. */
  directoryEnabled: () =>
    envTrue("ADID_DIRECTORY_ENABLED") || envTrue("ADID_NEON_DIRECTORY_ENABLED"),
  /** Neon-specific directory adapter gate (legacy name from PR #41). */
  neonDirectoryEnabled: () => envTrue("ADID_NEON_DIRECTORY_ENABLED"),
  /** Stage 1: allow building verified public AD.iD sign-in links for Wix (no sessions). */
  wixPublicLinkEnabled: () => envTrue("ADID_WIX_PUBLIC_LINK_ENABLED"),
  /** Stage 2: dual-proof Clerk↔Wix identity linking PoC — must stay false until approved. */
  accountLinkingEnabled: () => envTrue("ADID_ACCOUNT_LINKING_ENABLED"),
  /** Stage 3: Wix Velo member session bridge — disabled by default. */
  wixSessionBridgeEnabled: () => envTrue("ADID_WIX_SESSION_BRIDGE_ENABLED"),
  /** Cross-app OIDC federation claims — false until each RP is separately verified. */
  crossAppFederationEnabled: () => envTrue("ADID_CROSS_APP_FEDERATION_ENABLED"),
} as const;

export function assertFederationDisabled(): void {
  if (adidFlags.accountLinkingEnabled()) {
    throw new Error("ADID_ACCOUNT_LINKING_ENABLED must remain false in this sandbox");
  }
  if (adidFlags.wixSessionBridgeEnabled()) {
    throw new Error("ADID_WIX_SESSION_BRIDGE_ENABLED must remain false (phase 1 is link-only)");
  }
  if (adidFlags.crossAppFederationEnabled()) {
    throw new Error("ADID_CROSS_APP_FEDERATION_ENABLED must remain false until RP clients are verified");
  }
}
