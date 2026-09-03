import type { PlaceAccessProfile } from "@/lib/access/fit/types";
import type { GaisEvidenceRef, GaisEvidenceState } from "@/lib/gais/contracts/evidence";

/**
 * Public accessibility-discovery projection for Access Experience V2.
 * Never includes Prisma models, diagnosis fields, or participant PII.
 */
export type AccessExplorationCapabilityFacts = {
  pathWidthMm: number | null;
  doorWidthMm: number | null;
  maxGradientPercent: number | null;
  kerbRampPresent: boolean | null;
  liftPresent: boolean | null;
  changingPlacesPresent: boolean | null;
  captioningAvailable: boolean | null;
  highContrastSignage: boolean | null;
  tactileCues: boolean | null;
  quietArea: boolean | null;
  lowStimulusEnvironment: boolean | null;
  textAacCommunication: boolean | null;
  surfaceFirmness: "smooth" | "firm" | "uneven" | "unknown" | null;
};

export type AccessExplorationEvidenceSummary = {
  dominantState: GaisEvidenceState;
  freshnessLabel: string;
  lastObservedAt: string | null;
  confidenceLabel: "high" | "medium" | "low" | "unknown";
  disputed: boolean;
  refs: GaisEvidenceRef[];
};

export type AccessExplorationAccreditationSummary = {
  tier: string | null;
  disclaimer: string;
};

export type AccessExplorationDto = {
  accessPlaceId: string;
  name: string;
  category: string;
  suburb: string | null;
  stateOrRegion: string | null;
  addressText: string | null;
  /** False when coordinates are missing — place remains list-eligible. */
  hasCoordinates: boolean;
  latitude: number | null;
  longitude: number | null;
  reviewCount: number;
  /** Fit-facing profile (nullable facts → UNKNOWN in AccessFit V2). */
  placeProfile: PlaceAccessProfile;
  /** Typed capability facts preferred over synthetic demo booleans. */
  capabilityFacts: AccessExplorationCapabilityFacts;
  evidence: AccessExplorationEvidenceSummary;
  accreditation: AccessExplorationAccreditationSummary | null;
};

/** Minimal view consumed by exploration-results / AccessFit. */
export type AccessExplorationFitView = {
  id: string;
  profile: PlaceAccessProfile;
};

export function toAccessExplorationFitView(
  dto: AccessExplorationDto,
): AccessExplorationFitView {
  return { id: dto.accessPlaceId, profile: dto.placeProfile };
}

export const EMPTY_CAPABILITY_FACTS: AccessExplorationCapabilityFacts = {
  pathWidthMm: null,
  doorWidthMm: null,
  maxGradientPercent: null,
  kerbRampPresent: null,
  liftPresent: null,
  changingPlacesPresent: null,
  captioningAvailable: null,
  highContrastSignage: null,
  tactileCues: null,
  quietArea: null,
  lowStimulusEnvironment: null,
  textAacCommunication: null,
  surfaceFirmness: null,
};
