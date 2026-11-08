/**
 * Trust-boundary separation for NDIA claiming.
 * NDIA ≠ NDIS Commission ≠ Services Australia ≠ ADHA FHIR ≠ DoHDA B2G.
 */

export const NDIA_TRUST_BOUNDARY = "ndia_provider_api" as const;

export const SEPARATE_TRUST_BOUNDARIES = [
  "ndis_commission_registration_screening",
  "services_australia_identity_ram_myid",
  "adha_fhir_my_health_record",
  "dohda_aged_care_b2g",
] as const;

export type SeparateTrustBoundary = (typeof SEPARATE_TRUST_BOUNDARIES)[number];

/** Modules that must not be imported by NDIA provider-claiming transport. */
export const FORBIDDEN_CROSS_BOUNDARY_IMPORTS = [
  "lib/integrations/dohda-b2g",
  "lib/fhir/",
  "ndiscommission",
  "worker-screening",
  "medtronic",
  "spice-",
] as const;

export function assertNdiaTrustBoundarySource(source: string): void {
  const normalised = source.toLowerCase();
  for (const needle of FORBIDDEN_CROSS_BOUNDARY_IMPORTS) {
    if (normalised.includes(needle.toLowerCase())) {
      throw new Error(
        `NDIA_TRUST_BOUNDARY_VIOLATION: must not reference ${needle}`,
      );
    }
  }
}

export function describeTrustBoundaries(): {
  thisBoundary: typeof NDIA_TRUST_BOUNDARY;
  mustRemainSeparate: readonly SeparateTrustBoundary[];
} {
  return {
    thisBoundary: NDIA_TRUST_BOUNDARY,
    mustRemainSeparate: SEPARATE_TRUST_BOUNDARIES,
  };
}
