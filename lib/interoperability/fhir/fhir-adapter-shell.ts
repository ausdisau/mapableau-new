/**
 * FHIR outbound adapter — SHELL ONLY.
 *
 * Wave 9 never posts to a live FHIR server. Any code path that resolves an
 * outbound FHIR write must call `refuseFhirOutbound` first. If
 * `FEDERATION_FHIR_OUTBOUND_ENABLED` is set to true AND an operator has
 * recorded a runbook step, the call is allowed; otherwise it throws.
 */

export interface FhirOutboundIntent {
  resource: unknown;
  endpoint: string;
  purposeSummary: string;
  operatorRunbookRef?: string;
}

export function refuseFhirOutbound(intent: FhirOutboundIntent): void {
  const enabled = process.env.FEDERATION_FHIR_OUTBOUND_ENABLED === "true";
  if (!enabled) {
    throw new Error(
      `fhir_outbound_disabled: ${intent.endpoint} — set FEDERATION_FHIR_OUTBOUND_ENABLED=true and provide operatorRunbookRef`
    );
  }
  if (!intent.operatorRunbookRef) {
    throw new Error(
      "fhir_outbound_runbook_ref_required — a runbook step must be recorded before enabling"
    );
  }
}

export async function simulatorEmit(
  intent: FhirOutboundIntent
): Promise<{ simulator: true; artifactRef: string }> {
  return {
    simulator: true,
    artifactRef: `simulator://${Buffer.from(intent.endpoint).toString(
      "base64url"
    )}`,
  };
}
