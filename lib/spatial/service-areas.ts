import type {
  ProviderServiceArea,
  ServiceAreaContainmentResult,
} from "@/lib/spatial/service-area-types";

/** Haversine distance in km. */
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const r = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function evaluateServiceAreaContainment(
  area: ProviderServiceArea,
  query: {
    postcode?: string;
    latitude?: number;
    longitude?: number;
  },
): ServiceAreaContainmentResult {
  const explanation: string[] = [
    `Provider states coverage status: ${area.status.replace(/_/g, " ")}.`,
    `Availability signal: ${area.availability} (not the same as geographic coverage).`,
  ];

  if (area.travelFeesMayApply) {
    explanation.push("Travel fees may apply.");
  }
  explanation.push(area.hardRequirementsNote);
  explanation.push(
    "Payment or advertising status must not improve compatibility ranking.",
  );

  if (
    area.status === "not_serviced" ||
    area.status === "provider_not_confirmed"
  ) {
    return {
      covered: false,
      status: area.status,
      availability: area.availability,
      explanation,
    };
  }

  let covered = false;

  if (area.geometrySource === "postcode_list" && query.postcode) {
    const normalised = query.postcode.trim();
    covered = area.boundaryReferences.some((p) => p.trim() === normalised);
    explanation.push(
      covered
        ? `Postcode ${normalised} is listed in the provider service area.`
        : `Postcode ${normalised} is not listed in the provider service area.`,
    );
  } else if (
    area.geometrySource === "radius_from_outlet" &&
    query.latitude != null &&
    query.longitude != null &&
    area.outletLatitude != null &&
    area.outletLongitude != null &&
    area.radiusKm != null
  ) {
    const d = distanceKm(
      { lat: area.outletLatitude, lng: area.outletLongitude },
      { lat: query.latitude, lng: query.longitude },
    );
    covered = d <= area.radiusKm;
    explanation.push(
      covered
        ? `Location is within ${area.radiusKm} km of the outlet (${d.toFixed(1)} km).`
        : `Location is outside the ${area.radiusKm} km outlet radius (${d.toFixed(1)} km).`,
    );
  } else if (
    area.geometrySource === "lga_set" ||
    area.geometrySource === "administrative_boundary_set"
  ) {
    explanation.push(
      "Administrative boundary containment requires a licensed Boundaries product — treat as unconfirmed in this wave.",
    );
    covered = false;
  } else {
    explanation.push(
      "Insufficient query fields or geometry source to evaluate containment.",
    );
  }

  if (area.status === "stale" || area.availability === "stale") {
    explanation.push("Service-area data may be stale — confirm with the provider.");
  }

  return {
    covered,
    status: area.status,
    availability: area.availability,
    explanation,
  };
}

/** Synthetic demo areas for contract tests and disabled-by-default API. */
export function listSyntheticProviderServiceAreas(): ProviderServiceArea[] {
  return [
    {
      serviceAreaId: "synth-org-care-postcodes",
      organisationId: "org_synthetic_care",
      organisationLabel: "Synthetic Care Co",
      serviceCategory: "daily_living",
      geometrySource: "postcode_list",
      boundaryReferences: ["2000", "2010", "2541"],
      effectiveDate: "2026-01-01",
      status: "regularly_serviced",
      availability: "unknown",
      evidence: ["Synthetic provider declaration for pilot"],
      createdBy: "system:synthetic",
      travelFeesMayApply: true,
      hardRequirementsNote:
        "Hard accessibility and worker-matching requirements still need checking.",
    },
    {
      serviceAreaId: "synth-org-transport-radius",
      organisationId: "org_synthetic_transport",
      organisationLabel: "Synthetic Accessible Transport",
      serviceCategory: "transport",
      geometrySource: "radius_from_outlet",
      boundaryReferences: [],
      outletLatitude: -33.8688,
      outletLongitude: 151.2093,
      radiusKm: 25,
      effectiveDate: "2026-01-01",
      status: "limited_capacity",
      availability: "stale",
      evidence: ["Synthetic radius coverage — capacity not live"],
      createdBy: "system:synthetic",
      reviewedBy: "ops:synthetic",
      travelFeesMayApply: true,
      hardRequirementsNote:
        "Vehicle accessibility and booking windows still need checking.",
    },
  ];
}

export function explainServiceAreaForFinder(
  result: ServiceAreaContainmentResult,
): string {
  return result.explanation.join(" ");
}
