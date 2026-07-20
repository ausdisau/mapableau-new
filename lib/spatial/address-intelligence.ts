import { geoscapePredictiveConfig } from "@/lib/config/geoscape-predictive";
import { createGeoscapeSourceReference } from "@/lib/spatial/provenance";
import type {
  AddressResolutionResult,
  SpatialCandidate,
  SpatialCandidateStatus,
} from "@/lib/spatial/types";
import type { GeoscapeResolvedAddress } from "@/types/geoscape-predictive";

const DEFAULT_LIMITATIONS = [
  "Valid address is not the same as an accessible location.",
  "Coordinates and G-NAF identifiers do not confirm a usable entrance or journey.",
  "Building, property, and parcel candidates remain inferred until confirmed.",
  "This result is not building-code compliance, planning approval, or safety advice.",
] as const;

/**
 * Build an AddressResolutionResult from a Geoscape Predictive resolve payload.
 * Building/property/parcel products are not licensed in Wave 1 — candidates stay empty
 * unless explicitly supplied as inferred stubs for confirmation UX tests.
 */
export function buildAddressResolutionResult(input: {
  resolved: GeoscapeResolvedAddress;
  buildingCandidates?: SpatialCandidate[];
  propertyCandidate?: SpatialCandidate;
  parcelCandidate?: SpatialCandidate;
  administrativeAreas?: SpatialCandidate[];
  retrievedAt?: string;
}): AddressResolutionResult {
  const sourceReference = createGeoscapeSourceReference({
    product: "predictive",
    endpoint: "/predictive/address/{id}",
    dataset: geoscapePredictiveConfig.dataset,
    retrievedAt: input.retrievedAt,
  });

  const buildingCandidates = input.buildingCandidates ?? [];
  const administrativeAreas = input.administrativeAreas ?? [];
  const candidateCount =
    buildingCandidates.length +
    (input.propertyCandidate ? 1 : 0) +
    (input.parcelCandidate ? 1 : 0);

  const reasons: string[] = [];
  if (candidateCount > 1) {
    reasons.push("Multiple spatial candidates require participant confirmation.");
  }
  if (buildingCandidates.length === 0) {
    reasons.push(
      "No licensed building candidates attached — confirm the location from the address list.",
    );
  }
  if (input.resolved.lat == null || input.resolved.lng == null) {
    reasons.push("Coordinates missing — map confirmation is optional; use the text address.");
  }

  return {
    formattedAddress: input.resolved.formattedAddress,
    latitude: input.resolved.lat,
    longitude: input.resolved.lng,
    addressId: input.resolved.gnafId ?? input.resolved.id,
    suburb: input.resolved.suburb,
    state: input.resolved.state,
    postcode: input.resolved.postcode,
    buildingCandidates,
    propertyCandidate: input.propertyCandidate,
    parcelCandidate: input.parcelCandidate,
    administrativeAreas,
    sourceReference,
    ambiguity: {
      isAmbiguous: reasons.length > 0 || candidateCount > 1,
      reasons,
      candidateCount,
    },
    requiresConfirmation: true,
    confirmationStatus: "inferred",
    limitations: [...DEFAULT_LIMITATIONS],
  };
}

/**
 * Apply a confirmation decision. Never upgrades inferred → accessible.
 * Does not persist; callers own storage with consent and purpose checks.
 */
export function confirmAddressResolution(
  result: AddressResolutionResult,
  decision: {
    status: Extract<
      SpatialCandidateStatus,
      "participant_confirmed" | "staff_confirmed" | "rejected"
    >;
  },
): AddressResolutionResult {
  if (decision.status === "rejected") {
    return {
      ...result,
      confirmationStatus: "rejected",
      requiresConfirmation: false,
      limitations: [
        ...result.limitations,
        "Participant or staff rejected this location candidate.",
      ],
    };
  }

  return {
    ...result,
    confirmationStatus: decision.status,
    requiresConfirmation: false,
    buildingCandidates: result.buildingCandidates.map((c) =>
      c.status === "inferred"
        ? {
            ...c,
            status:
              decision.status === "participant_confirmed"
                ? ("participant_confirmed" as const)
                : ("staff_confirmed" as const),
          }
        : c,
    ),
  };
}

/** Guard: inferred results must not be labelled confirmed in presentation. */
export function isConfirmedAddressResolution(
  result: AddressResolutionResult,
): boolean {
  return (
    !result.requiresConfirmation &&
    (result.confirmationStatus === "participant_confirmed" ||
      result.confirmationStatus === "staff_confirmed")
  );
}
