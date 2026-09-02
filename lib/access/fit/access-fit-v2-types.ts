
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
      p.lowSensoryNeeded || p.quietAreaPreferred || p.lowStimulusPreferred,
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
      p.AuslanNeeded || p.AACFriendlyNeeded || p.textCommunicationPreferred,
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
