/**
 * Live NDIA transport gate.
 * Endpoint paths and auth semantics are supplied only after Digital Partnership
 * Office approval and an NDIA technical pack. Until then, any HTTP submit throws.
 *
 * Official public guidance:
 * https://ndis.gov.au/providers/working-provider/using-provider-portals/how-connect-our-systems
 * https://apiportal.ndis.gov.au/
 */

export const NDIA_TRANSPORT_BLOCKERS = [
  "NDIA Digital Partnership Office approval not evidenced",
  "NDIA-issued technical pack (endpoints, auth, schemas) not loaded into MapAble",
  "Cyber clearance and organisational approvals not evidenced",
  "Invented paths such as /v1/provider/claims are forbidden",
  "client_credentials / PRODA / myID API semantics must not be assumed",
] as const;

export class NdiaAuthorisedTransportNotImplementedError extends Error {
  readonly code = "NDIA_AUTHORISED_TRANSPORT_NOT_IMPLEMENTED";
  readonly blockers = NDIA_TRANSPORT_BLOCKERS;

  constructor(
    message = "NDIA authorised transport is not implemented; live claim submission is blocked",
  ) {
    super(message);
    this.name = "NdiaAuthorisedTransportNotImplementedError";
  }
}

/** Hard stop for any attempt to dial NDIA over the network from this module. */
export function assertNdiaLiveTransportBlocked(): never {
  throw new NdiaAuthorisedTransportNotImplementedError();
}

/**
 * Reject known-invented path fragments so they cannot be configured “quietly”.
 * This is a safety rail, not an allowlist of real NDIA paths.
 */
export function assertSubmitPathNotInvented(path: string | undefined): void {
  if (!path) return;
  const normalised = path.trim().toLowerCase();
  const invented = [
    "/v1/provider/claims",
    "/v1/claims",
    "/provider/claims",
  ];
  if (invented.some((p) => normalised === p || normalised.endsWith(p))) {
    throw new NdiaAuthorisedTransportNotImplementedError(
      `Configured NDIA submit path is not independently verified: ${path}`,
    );
  }
}
