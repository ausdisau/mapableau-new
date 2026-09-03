
import type { AccessRequirementProfile } from "@/lib/access/experience/types";
import type { PlaceAccessProfile } from "@/lib/access/fit/types";
import type { GaisEvidenceRef, GaisEvidenceState } from "@/lib/gais/contracts/evidence";

export type RequirementFitState = "MEETS" | "DOES_NOT_MATCH" | "UNKNOWN";

export type RequirementFit = {
  requirementId: string;
  label: string;
  state: RequirementFitState;
  evidenceRefs: GaisEvidenceRef[];
  explanation?: string;
};

export type EvidenceSummary = {
  verifiedCount: number;
  communityCount: number;
  unknownCount: number;
  staleCount: number;
  disputedCount: number;
  dominantState: GaisEvidenceState;
};

export type AccessFitResultV2 = {
  requirements: RequirementFit[];
  metCount: number;
  unmetCount: number;
  unknownCount: number;
  selectedCount: number;
  evidenceSummary: EvidenceSummary;
  /** Backward compatibility for legacy UI components. */
  legacyScore?: number;
};

export type RequirementCheckDefinition = {
  id: string;
  label: string;
  isSelected: (profile: AccessRequirementProfile) => boolean;
  evaluate: (
    profile: AccessRequirementProfile,
    place: PlaceAccessProfile,
  ) => Pick<RequirementFit, "state" | "explanation" | "evidenceRefs">;
};

function evidenceFromPlace(
  place: PlaceAccessProfile,
  observedLabel: string,
): GaisEvidenceRef[] {
  if (place.confidence === "high" && place.lastVerified) {
    return [
      {
        sourceType: "VERIFIED",
        sourceLabel: observedLabel,
        observedAt: place.lastVerified,
        verifiedAt: place.lastVerified,
      },
    ];
  }
  if (place.confidence === "medium") {
    return [
      {
        sourceType: "COMMUNITY_REPORTED",
        sourceLabel: observedLabel,
        observedAt: place.lastVerified ?? undefined,
      },
    ];
  }
  if (place.confidence === "low") {
    return [
      {
        sourceType: "COMMUNITY_REPORTED",
        sourceLabel: `${observedLabel} (stale/low confidence)`,
        observedAt: place.lastVerified ?? undefined,
        confidence: 0.3,
      },
    ];
  }
  return [{ sourceType: "UNKNOWN", sourceLabel: observedLabel }];
}

function boolFit(
  value: boolean | null,
  meetLabel: string,
  unmetLabel: string,
  unknownLabel: string,
  place: PlaceAccessProfile,
): Pick<RequirementFit, "state" | "explanation" | "evidenceRefs"> {
  if (value === true) {
    return {
      state: "MEETS",
      explanation: meetLabel,
      evidenceRefs: evidenceFromPlace(place, meetLabel),
    };
  }
  if (value === false) {
    return {
      state: "DOES_NOT_MATCH",
      explanation: unmetLabel,
      evidenceRefs: evidenceFromPlace(place, unmetLabel),
    };
  }
  return {
    state: "UNKNOWN",
    explanation: unknownLabel,
    evidenceRefs: [{ sourceType: "UNKNOWN", sourceLabel: unknownLabel }],
  };
}

export const REQUIREMENT_CHECKS: RequirementCheckDefinition[] = [
  {
    id: "step_free_entry",
    label: "Step-free entry",
    isSelected: (p) =>
      p.stepFreeRequired || p.wheelchairUser || p.powerchairUser,
    evaluate: (p, place) =>
      boolFit(
        place.stepFreeEntry,
        "Step-free entry reported",
        "Steps or level change reported at entrance",
        "Step-free entry unknown",
        place,
      ),
  },
  {
    id: "door_width",
    label: "Entrance door width",
    isSelected: (p) =>
      p.wheelchairUser ||
      p.powerchairUser ||
      p.minimumDoorWidthMm != null,
    evaluate: (p, place) => {
      const min =
        p.minimumDoorWidthMm ??
        (p.powerchairUser ? 900 : p.wheelchairUser ? 850 : 850);
      if (place.doorWidthMm == null) {
        return {
          state: "UNKNOWN",
          explanation: "Door width unknown",
          evidenceRefs: [{ sourceType: "UNKNOWN", sourceLabel: "Door width unknown" }],
        };
      }
      const meets = place.doorWidthMm >= min;
      return {
        state: meets ? "MEETS" : "DOES_NOT_MATCH",
        explanation: meets
          ? `Door width ${place.doorWidthMm} mm meets your ${min} mm preference`
          : `Door width ${place.doorWidthMm} mm may not meet your ${min} mm preference`,
        evidenceRefs: evidenceFromPlace(
          place,
          `Door width ${place.doorWidthMm} mm`,
        ),
      };
    },
  },
  {
    id: "internal_step_free",
    label: "Internal step-free movement",
    isSelected: (p) =>
      p.stepFreeRequired || p.wheelchairUser || p.powerchairUser,
    evaluate: (_p, place) =>
      boolFit(
        place.internalStepFree,
        "Internal step-free route reported",
        "Internal steps or level changes reported",
        "Internal step-free route unknown",
        place,
      ),
  },
  {
    id: "accessible_toilet",
    label: "Accessible toilet",
    isSelected: (p) => p.accessibleToiletRequired,
    evaluate: (_p, place) =>
      boolFit(
        place.accessibleToilet,
        "Accessible toilet reported",
        "No accessible toilet reported",
        "Accessible toilet unknown",
        place,
      ),
  },
  {
    id: "accessible_parking",
    label: "Accessible parking",
    isSelected: (p) => p.accessibleParkingNeeded,
    evaluate: (_p, place) =>
      boolFit(
        place.accessibleParking,
        "Accessible parking reported",
        "No accessible parking reported",
        "Accessible parking unknown",
        place,
      ),
  },
  {
    id: "drop_off",
    label: "Drop-off point",
    isSelected: (p) => p.dropOffNeeded,
    evaluate: (_p, place) =>
      boolFit(
        place.dropOffPoint,
        "Drop-off point reported",
        "No drop-off point reported",
        "Drop-off point unknown",
        place,
      ),
  },
  {
    id: "low_sensory",
    label: "Quiet or low-sensory option",
    isSelected: (p) =>
      Boolean(
        p.lowSensoryNeeded || p.quietAreaPreferred || p.lowStimulusPreferred,
      ),
    evaluate: (_p, place) =>
      boolFit(
        place.lowSensoryOption,
        "Quiet or sensory-friendly option reported",
        "No quiet or sensory-friendly option reported",
        "Sensory options unknown",
        place,
      ),
  },
  {
    id: "hearing_loop",
    label: "Hearing loop",
    isSelected: (p) => p.hearingLoopNeeded,
    evaluate: (_p, place) =>
      boolFit(
        place.hearingLoop,
        "Hearing loop reported",
        "No hearing loop reported",
        "Hearing loop unknown",
        place,
      ),
  },
  {
    id: "communication_support",
    label: "Staff communication support",
    isSelected: (p) =>
      Boolean(p.AuslanNeeded || p.AACFriendlyNeeded || p.textCommunicationPreferred),
    evaluate: (_p, place) =>
      boolFit(
        place.staffTraining,
        "Staff assistance / training noted",
        "Staff communication support not confirmed",
        "Staff training unknown",
        place,
      ),
  },
  {
    id: "assistance_animal",
    label: "Assistance animal welcome",
    isSelected: (p) => p.assistanceAnimal,
    evaluate: (_p, place) =>
      boolFit(
        place.assistanceAnimalWelcome,
        "Assistance animal welcome",
        "Assistance animal policy unclear or unwelcome",
        "Assistance animal policy unknown",
        place,
      ),
  },
  {
    id: "transport_bookable",
    label: "Transport bookable",
    isSelected: (p) => p.transportSupportNeeded,
    evaluate: (_p, place) =>
      boolFit(
        place.transportBookable,
        "Transport bookable",
        "Transport not bookable through MapAble for this place",
        "Transport bookability unknown",
        place,
      ),
  },
  {
    id: "path_width",
    label: "Path width",
    isSelected: (p) =>
      p.minimumPathWidthMm != null || p.wheelchairUser || p.powerchairUser,
    evaluate: (p, place) => {
      const min =
        p.minimumPathWidthMm ??
        (p.powerchairUser ? 1200 : p.wheelchairUser ? 900 : 900);
      if (place.pathWidthMm == null) {
        return {
          state: "UNKNOWN",
          explanation: "Path width unknown",
          evidenceRefs: [
            { sourceType: "UNKNOWN", sourceLabel: "Path width unknown" },
          ],
        };
      }
      const meets = place.pathWidthMm >= min;
      return {
        state: meets ? "MEETS" : "DOES_NOT_MATCH",
        explanation: meets
          ? `Path width ${place.pathWidthMm} mm meets your ${min} mm preference`
          : `Path width ${place.pathWidthMm} mm may not meet your ${min} mm preference`,
        evidenceRefs: evidenceFromPlace(
          place,
          `Path width ${place.pathWidthMm} mm`,
        ),
      };
    },
  },
  {
    id: "max_gradient",
    label: "Preferred maximum gradient",
    isSelected: (p) => p.maximumPreferredGradientPercent != null,
    evaluate: (p, place) => {
      const max = p.maximumPreferredGradientPercent!;
      if (place.maxGradientPercent == null) {
        return {
          state: "UNKNOWN",
          explanation: "Gradient unknown",
          evidenceRefs: [
            { sourceType: "UNKNOWN", sourceLabel: "Gradient unknown" },
          ],
        };
      }
      const meets = place.maxGradientPercent <= max;
      return {
        state: meets ? "MEETS" : "DOES_NOT_MATCH",
        explanation: meets
          ? `Reported gradient ${place.maxGradientPercent}% within your ${max}% preference`
          : `Reported gradient ${place.maxGradientPercent}% exceeds your ${max}% preference`,
        evidenceRefs: evidenceFromPlace(
          place,
          `Gradient ${place.maxGradientPercent}%`,
        ),
      };
    },
  },
  {
    id: "kerb_ramp",
    label: "Kerb ramp",
    isSelected: (p) => Boolean(p.kerbRampRequired),
    evaluate: (_p, place) =>
      boolFit(
        place.kerbRamp ?? null,
        "Kerb ramp / ramp access reported",
        "No kerb ramp reported",
        "Kerb ramp unknown",
        place,
      ),
  },
  {
    id: "lift",
    label: "Lift access",
    isSelected: (p) => Boolean(p.liftRequired),
    evaluate: (_p, place) =>
      boolFit(
        place.lift ?? null,
        "Lift access reported",
        "No lift reported",
        "Lift access unknown",
        place,
      ),
  },
  {
    id: "changing_places",
    label: "Changing Places facility",
    isSelected: (p) => Boolean(p.changingPlacesPreferred),
    evaluate: (_p, place) =>
      boolFit(
        place.changingPlaces ?? null,
        "Changing Places facility reported",
        "No Changing Places facility reported",
        "Changing Places availability unknown",
        place,
      ),
  },
  {
    id: "captioning",
    label: "Captioning",
    isSelected: (p) => Boolean(p.captioningPreferred),
    evaluate: (_p, place) =>
      boolFit(
        place.captioning ?? null,
        "Captioning reported",
        "Captioning not reported",
        "Captioning unknown",
        place,
      ),
  },
  {
    id: "high_contrast_signage",
    label: "High-contrast signage",
    isSelected: (p) => Boolean(p.highContrastSignagePreferred),
    evaluate: (_p, place) =>
      boolFit(
        place.highContrastSignage ?? null,
        "High-contrast signage reported",
        "High-contrast signage not reported",
        "Signage contrast unknown",
        place,
      ),
  },
  {
    id: "tactile_cues",
    label: "Tactile cues / braille signage",
    isSelected: (p) => Boolean(p.tactileCuesPreferred),
    evaluate: (_p, place) =>
      boolFit(
        place.tactileCues ?? null,
        "Tactile / braille cues reported",
        "Tactile cues not reported",
        "Tactile cues unknown",
        place,
      ),
  },
  {
    id: "surface_tolerance",
    label: "Surface quality",
    isSelected: (p) =>
      p.surfaceTolerance === "smooth_only" || p.surfaceTolerance === "firm_ok",
    evaluate: (p, place) => {
      const surface = place.surfaceQuality ?? null;
      if (surface == null) {
        return {
          state: "UNKNOWN",
          explanation: "Surface quality unknown",
          evidenceRefs: [
            { sourceType: "UNKNOWN", sourceLabel: "Surface quality unknown" },
          ],
        };
      }
      if (p.surfaceTolerance === "smooth_only") {
        const meets = surface === "smooth";
        return {
          state: meets ? "MEETS" : "DOES_NOT_MATCH",
          explanation: meets
            ? "Smooth surface reported"
            : `Surface reported as ${surface}; smooth preferred`,
          evidenceRefs: evidenceFromPlace(place, `Surface: ${surface}`),
        };
      }
      // firm_ok
      const meets = surface === "smooth" || surface === "firm";
      return {
        state: meets ? "MEETS" : "DOES_NOT_MATCH",
        explanation: meets
          ? `Surface (${surface}) within firm/smooth preference`
          : `Surface reported as ${surface}; may exceed firm preference`,
        evidenceRefs: evidenceFromPlace(place, `Surface: ${surface}`),
      };
    },
  },
];

export function buildEvidenceSummary(
  requirements: RequirementFit[],
  place: PlaceAccessProfile,
): EvidenceSummary {
  let verifiedCount = 0;
  let communityCount = 0;
  let unknownCount = 0;
  let staleCount = 0;

  for (const req of requirements) {
    for (const ref of req.evidenceRefs) {
      if (ref.sourceType === "VERIFIED" || ref.sourceType === "AUTHORITATIVE_SOURCE") {
        verifiedCount += 1;
      } else if (ref.sourceType === "COMMUNITY_REPORTED") {
        communityCount += 1;
      } else if (ref.sourceType === "UNKNOWN") {
        unknownCount += 1;
      }
    }
  }

  if (place.confidence === "low") staleCount += 1;

  const disputedCount = 0;

  let dominantState: GaisEvidenceState = "UNKNOWN";
  if (verifiedCount >= communityCount && verifiedCount > 0) {
    dominantState = "VERIFIED";
  } else if (communityCount > 0) {
    dominantState = "COMMUNITY_REPORTED";
  }

  return {
    verifiedCount,
    communityCount,
    unknownCount,
    staleCount,
    disputedCount,
    dominantState,
  };
}
