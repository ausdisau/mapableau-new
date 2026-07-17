import { isFederationActivated } from "@/lib/credentials/issuance";

/**
 * OID4VP presentation adapter — shell only. See `oid4vci.ts` for the
 * production-refusal pattern; this is the presentation counterpart.
 */
export function refuseProductionPresentation(context: string): void {
  if (!isFederationActivated()) {
    throw new Error(
      `oid4vp_production_disabled: ${context} — activate FEDERATION_ACTIVATION and pass conformance to proceed`
    );
  }
}

export interface OidVpProfile {
  supportedResponseTypes: string[];
  supportedClientMetadata: string[];
  simulator: boolean;
  disclaimer: string;
}

export function buildVpProfile(): OidVpProfile {
  return {
    supportedResponseTypes: ["vp_token"],
    supportedClientMetadata: ["client_metadata_by_reference"],
    simulator: !isFederationActivated(),
    disclaimer:
      "Presentations are simulator-only unless production activation is enabled and the verifier is trust-registry allowed.",
  };
}
