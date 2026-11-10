/**
 * Three separately gated Wix stages. All default OFF except stage-1 link
 * evaluation which still requires an operator-approved AD.iD host allowlist.
 */

function envTrue(name: string): boolean {
  return process.env[name] === "true";
}

export const wixStageFlags = {
  /** Stage 1: verified public AD.iD sign-in link from Wix (navigation only). */
  publicLinkEnabled: () => envTrue("ADID_WIX_PUBLIC_LINK_ENABLED"),
  /** Stage 2: identity-linking PoC — dual authenticated control required. */
  identityLinkingEnabled: () => envTrue("ADID_ACCOUNT_LINKING_ENABLED"),
  /** Stage 3: native Wix session handoff — disabled by default. */
  sessionHandoffEnabled: () => envTrue("ADID_WIX_SESSION_BRIDGE_ENABLED"),
} as const;

export function assertDangerousWixStagesDisabled(): void {
  if (wixStageFlags.identityLinkingEnabled()) {
    throw new Error(
      "ADID_ACCOUNT_LINKING_ENABLED must remain false until dual-proof PoC is operator-approved",
    );
  }
  if (wixStageFlags.sessionHandoffEnabled()) {
    throw new Error(
      "ADID_WIX_SESSION_BRIDGE_ENABLED must remain false until one-time handoff is reviewed",
    );
  }
}
