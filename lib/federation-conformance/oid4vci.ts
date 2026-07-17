import { isFederationActivated } from "@/lib/credentials/issuance";

/**
 * OID4VCI adapter — shell only.
 *
 * Well-known metadata is safe to expose because it only advertises MapAble's
 * simulator profile. Issuance endpoints refuse activation unless the
 * conformance suite has passed and env activation is set.
 */

export interface OidVciWellKnown {
  credential_issuer: string;
  authorization_servers: string[];
  simulator: boolean;
  supported_credentials: Array<{
    format: string;
    scope: string;
    display_name: string;
  }>;
  disclaimer: string;
}

export function buildIssuerMetadata(input: {
  publicOrigin: string;
  schemaKeys: string[];
}): OidVciWellKnown {
  return {
    credential_issuer: input.publicOrigin,
    authorization_servers: [input.publicOrigin],
    simulator: !isFederationActivated(),
    supported_credentials: input.schemaKeys.map((s) => ({
      format: "jwt_vc_json",
      scope: `credential:${s}`,
      display_name: s,
    })),
    disclaimer:
      "MapAble credentials are not government credentials and are simulator-only unless production activation is enabled.",
  };
}

export function refuseProductionIssuance(context: string): void {
  if (!isFederationActivated()) {
    throw new Error(
      `oid4vci_production_disabled: ${context} — activate FEDERATION_ACTIVATION and pass conformance to proceed`
    );
  }
}
